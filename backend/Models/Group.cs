using Newtonsoft.Json;

namespace TirageAuSort.Api.Models;

public class Group
{
    [JsonProperty("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public List<string> Participants { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
