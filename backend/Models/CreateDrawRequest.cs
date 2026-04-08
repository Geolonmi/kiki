namespace TirageAuSort.Api.Models;

public class CreateDrawRequest
{
    public string Title { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public int NumberOfWinners { get; set; } = 1;
}
