namespace TirageAuSort.Api.Models;

public class CreateGroupRequest
{
    public string Name { get; set; } = string.Empty;
    public List<string> Participants { get; set; } = [];
}
