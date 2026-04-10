using Microsoft.Azure.Cosmos;
using TirageAuSort.Api.Models;

namespace TirageAuSort.Api.Services;

/// <summary>
/// Implémentation du service de groupes de participant·e·s avec Azure CosmosDB.
/// </summary>
public class CosmosGroupService : IGroupService
{
    private readonly Container _container;

    public CosmosGroupService(CosmosClient cosmosClient, IConfiguration configuration)
    {
        var databaseName = configuration["CosmosDb:DatabaseName"]!;
        var containerName = configuration["CosmosDb:GroupsContainerName"]!;
        _container = cosmosClient.GetContainer(databaseName, containerName);
    }

    public Group CreateGroup(CreateGroupRequest request)
    {
        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Participants = request.Participants,
            CreatedAt = DateTime.UtcNow
        };

        _container.CreateItemAsync(group, new PartitionKey(group.Id.ToString()))
            .GetAwaiter().GetResult();

        return group;
    }

    public Group? GetGroupById(Guid id)
    {
        try
        {
            var response = _container
                .ReadItemAsync<Group>(id.ToString(), new PartitionKey(id.ToString()))
                .GetAwaiter().GetResult();
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public List<Group> GetAllGroups()
    {
        var query = new QueryDefinition("SELECT * FROM c ORDER BY c.createdAt ASC");
        var groups = new List<Group>();

        using var feed = _container.GetItemQueryIterator<Group>(query);
        while (feed.HasMoreResults)
        {
            var batch = feed.ReadNextAsync().GetAwaiter().GetResult();
            groups.AddRange(batch);
        }

        return groups;
    }

    public Group UpdateGroup(Guid id, CreateGroupRequest request)
    {
        var group = GetGroupById(id)
            ?? throw new InvalidOperationException($"Groupe {id} non trouvé");

        group.Name = request.Name;
        group.Participants = request.Participants;

        _container.ReplaceItemAsync(group, group.Id.ToString(), new PartitionKey(group.Id.ToString()))
            .GetAwaiter().GetResult();

        return group;
    }

    public void DeleteGroup(Guid id)
    {
        try
        {
            _container.DeleteItemAsync<Group>(id.ToString(), new PartitionKey(id.ToString()))
                .GetAwaiter().GetResult();
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            throw new InvalidOperationException($"Groupe {id} non trouvé");
        }
    }
}
