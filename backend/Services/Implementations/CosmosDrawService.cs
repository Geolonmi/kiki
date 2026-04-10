using Microsoft.Azure.Cosmos;
using TirageAuSort.Api.Models;

namespace TirageAuSort.Api.Services;

/// <summary>
/// Implémentation du service de tirages au sort avec Azure CosmosDB.
/// Limite de 10 tirages simultanés - le plus ancien est supprimé si dépassé.
/// </summary>
public class CosmosDrawService : IDrawService
{
    private readonly Container _container;
    private readonly Random _random = new();
    private const int MaxDraws = 10;

    public CosmosDrawService(CosmosClient cosmosClient, IConfiguration configuration)
    {
        var databaseName = configuration["CosmosDb:DatabaseName"]!;
        var containerName = configuration["CosmosDb:ContainerName"]!;
        _container = cosmosClient.GetContainer(databaseName, containerName);
    }

    public Draw CreateDraw(CreateDrawRequest request, string createdBy)
    {
        var draw = new Draw
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            CreatedBy = createdBy,
            ScheduledDate = request.ScheduledDate,
            NumberOfWinners = request.NumberOfWinners,
            Status = DrawStatus.Draft
        };

        // Vérifier la limite de 10 tirages et supprimer le plus ancien si nécessaire
        EnforceMaxDrawsLimit().GetAwaiter().GetResult();

        _container.CreateItemAsync(draw, new PartitionKey(draw.Id.ToString()))
            .GetAwaiter().GetResult();

        return draw;
    }

    public Draw? GetDrawById(Guid id)
    {
        try
        {
            var response = _container
                .ReadItemAsync<Draw>(id.ToString(), new PartitionKey(id.ToString()))
                .GetAwaiter().GetResult();
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public List<Draw> GetAllDraws()
    {
        var query = new QueryDefinition("SELECT * FROM c");
        var draws = new List<Draw>();

        using var feed = _container.GetItemQueryIterator<Draw>(query);
        while (feed.HasMoreResults)
        {
            var batch = feed.ReadNextAsync().GetAwaiter().GetResult();
            draws.AddRange(batch);
        }

        return draws;
    }

    public void AddParticipant(Guid drawId, CreateParticipantRequest request)
    {
        var draw = GetDrawById(drawId)
            ?? throw new InvalidOperationException($"Tirage {drawId} non trouvé");

        if (draw.Status != DrawStatus.Draft)
            throw new InvalidOperationException("Impossible d'ajouter des participant·e·s à un tirage non en brouillon");

        draw.Participants.Add(new Participant
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
        });

        _container.ReplaceItemAsync(draw, draw.Id.ToString(), new PartitionKey(draw.Id.ToString()))
            .GetAwaiter().GetResult();
    }

    public void RemoveParticipant(Guid drawId, Guid participantId)
    {
        var draw = GetDrawById(drawId)
            ?? throw new InvalidOperationException($"Tirage {drawId} non trouvé");

        if (draw.Status != DrawStatus.Draft)
            throw new InvalidOperationException("Impossible de supprimer des participant·e·s d'un tirage non en brouillon");

        var participant = draw.Participants.FirstOrDefault(p => p.Id == participantId);
        if (participant != null)
        {
            draw.Participants.Remove(participant);
            _container.ReplaceItemAsync(draw, draw.Id.ToString(), new PartitionKey(draw.Id.ToString()))
                .GetAwaiter().GetResult();
        }
    }

    public Draw ExecuteDraw(Guid drawId)
    {
        var draw = GetDrawById(drawId)
            ?? throw new InvalidOperationException($"Tirage {drawId} non trouvé");

        if (draw.Participants.Count < draw.NumberOfWinners)
            throw new InvalidOperationException(
                $"Pas assez de participant·e·s ({draw.Participants.Count}) pour {draw.NumberOfWinners} gagnant·e·s");

        draw.Winners = draw.Participants
            .OrderBy(_ => _random.Next())
            .Take(draw.NumberOfWinners)
            .ToList();

        draw.Status = DrawStatus.Executed;
        draw.ExecutedAt = DateTime.UtcNow;

        _container.ReplaceItemAsync(draw, draw.Id.ToString(), new PartitionKey(draw.Id.ToString()))
            .GetAwaiter().GetResult();

        return draw;    
    }

    public void DeleteDraw(Guid drawId)
    {
        try
        {
            _container.DeleteItemAsync<Draw>(drawId.ToString(), new PartitionKey(drawId.ToString()))
                .GetAwaiter().GetResult();
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            throw new InvalidOperationException($"Tirage {drawId} non trouvé");
        }
    }

    // Supprime le tirage le plus ancien si on dépasse 10
    private async Task EnforceMaxDrawsLimit()
    {
        var query = new QueryDefinition("SELECT * FROM c ORDER BY c.createdAt ASC");
        var draws = new List<Draw>();

        using var feed = _container.GetItemQueryIterator<Draw>(query);
        while (feed.HasMoreResults)
        {
            var batch = await feed.ReadNextAsync();
            draws.AddRange(batch);
        }

        while (draws.Count >= MaxDraws)
        {
            var oldest = draws.First();
            await _container.DeleteItemAsync<Draw>(
                oldest.Id.ToString(),
                new PartitionKey(oldest.Id.ToString()));
            draws.RemoveAt(0);
        }
    }
}
