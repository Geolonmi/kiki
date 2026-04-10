using TirageAuSort.Api.Models;

namespace TirageAuSort.Api.Services;

/// <summary>
/// Implémentation en mémoire du service de tirages au sort.
/// </summary>
public class DrawService : IDrawService
{
    private readonly Dictionary<Guid, Draw> _draws = new();
    private readonly Random _random = new();

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

        _draws[draw.Id] = draw;
        return draw;
    }

    public Draw? GetDrawById(Guid id)
    {
        return _draws.TryGetValue(id, out var draw) ? draw : null;
    }

    public List<Draw> GetAllDraws()
    {
        return _draws.Values.ToList();
    }

    public void AddParticipant(Guid drawId, CreateParticipantRequest request)
    {
        if (!_draws.TryGetValue(drawId, out var draw))
            throw new InvalidOperationException($"Tirage {drawId} non trouvé");

        if (draw.Status != DrawStatus.Draft)
            throw new InvalidOperationException("Impossible d'ajouter des participant·e·s à un tirage non en brouillon");

        draw.Participants.Add(new Participant
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
        });
    }

    public void RemoveParticipant(Guid drawId, Guid participantId)
    {
        if (!_draws.TryGetValue(drawId, out var draw))
            throw new InvalidOperationException($"Tirage {drawId} non trouvé");

        if (draw.Status != DrawStatus.Draft)
            throw new InvalidOperationException("Impossible de supprimer des participant·e·s d'un tirage non en brouillon");

        var participant = draw.Participants.FirstOrDefault(p => p.Id == participantId);
        if (participant != null)
            draw.Participants.Remove(participant);
    }

    public Draw ExecuteDraw(Guid drawId)
    {
        if (!_draws.TryGetValue(drawId, out var draw))
            throw new InvalidOperationException($"Tirage {drawId} non trouvé");

        if (draw.Participants.Count < draw.NumberOfWinners)
            throw new InvalidOperationException(
                $"Pas assez de participant·e·s ({draw.Participants.Count}) pour {draw.NumberOfWinners} gagnant·e·s");

        draw.Winners = draw.Participants
            .OrderBy(_ => _random.Next())
            .Take(draw.NumberOfWinners)
            .ToList();

        draw.Status = DrawStatus.Executed;
        draw.ExecutedAt = DateTime.UtcNow;

        return draw;
    }

    public void DeleteDraw(Guid drawId)
    {
        if (!_draws.Remove(drawId))
            throw new InvalidOperationException($"Tirage {drawId} non trouvé");
    }
}
