using Newtonsoft.Json;

namespace TirageAuSort.Api.Models;

public class Draw
{
    [JsonProperty("id")]
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ScheduledDate { get; set; }
    public int NumberOfWinners { get; set; } = 1;
    public List<Participant> Participants { get; set; } = [];
    public List<Participant> Winners { get; set; } = [];
    public DrawStatus Status { get; set; } = DrawStatus.Draft;
    public DateTime? ExecutedAt { get; set; }
}

public enum DrawStatus
{
    Draft,      // En création
    Scheduled,  // En attente de la date
    Executed,   // Tirage effectué
    Cancelled   // Annulé
}
