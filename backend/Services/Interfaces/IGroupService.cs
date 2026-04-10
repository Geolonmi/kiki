using TirageAuSort.Api.Models;

namespace TirageAuSort.Api.Services;

public interface IGroupService
{
    Group CreateGroup(CreateGroupRequest request);
    Group? GetGroupById(Guid id);
    List<Group> GetAllGroups();
    Group UpdateGroup(Guid id, CreateGroupRequest request);
    void DeleteGroup(Guid id);
}
