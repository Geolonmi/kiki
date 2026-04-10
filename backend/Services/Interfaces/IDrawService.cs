using TirageAuSort.Api.Models;

namespace TirageAuSort.Api.Services;

public interface IDrawService
{
    Draw CreateDraw(CreateDrawRequest request, string createdBy);
    Draw? GetDrawById(Guid id);
    List<Draw> GetAllDraws();
    void AddParticipant(Guid drawId, CreateParticipantRequest request);
    void RemoveParticipant(Guid drawId, Guid participantId);
    Draw ExecuteDraw(Guid drawId);
    void DeleteDraw(Guid drawId);
}
