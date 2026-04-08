using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TirageAuSort.Api.Models;
using TirageAuSort.Api.Services;
using System.Security.Claims;

namespace TirageAuSort.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DrawController : ControllerBase
{
    private readonly IDrawService _drawService;
    private readonly ILogger<DrawController> _logger;

    public DrawController(IDrawService drawService, ILogger<DrawController> logger)
    {
        _drawService = drawService;
        _logger = logger;
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue("preferred_username")
            ?? User.FindFirstValue(ClaimTypes.Email)
            ?? "unknown";
    }

    /// <summary>
    /// Créer un nouveau tirage au sort.
    /// </summary>
    [HttpPost]
    public IActionResult CreateDraw([FromBody] CreateDrawRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest("Le titre du tirage est requis");

        if (request.NumberOfWinners < 1)
            return BadRequest("Le nombre de gagnants doit être au moins 1");

        var userEmail = GetCurrentUserEmail();
        var draw = _drawService.CreateDraw(request, userEmail);

        _logger.LogInformation(
            "Tirage créé par {User}: {DrawId} - {Title}",
            userEmail, draw.Id, draw.Title);

        return CreatedAtAction(nameof(GetDraw), new { id = draw.Id }, draw);
    }

    /// <summary>
    /// Récupérer un tirage par son ID.
    /// </summary>
    [HttpGet("{id}")]
    public IActionResult GetDraw(Guid id)
    {
        var draw = _drawService.GetDrawById(id);
        if (draw == null)
            return NotFound();

        return Ok(draw);
    }

    /// <summary>
    /// Récupérer tous les tirages.
    /// </summary>
    [HttpGet]
    public IActionResult GetAllDraws()
    {
        var draws = _drawService.GetAllDraws();
        return Ok(draws);
    }

    /// <summary>
    /// Ajouter un participant à un tirage.
    /// </summary>
    [HttpPost("{drawId}/participants")]
    public IActionResult AddParticipant(Guid drawId, [FromBody] CreateParticipantRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Le nom est requis");

        try
        {
            _drawService.AddParticipant(drawId, request);
            var draw = _drawService.GetDrawById(drawId);
            return Ok(draw);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Supprimer un participant d'un tirage.
    /// </summary>
    [HttpDelete("{drawId}/participants/{participantId}")]
    public IActionResult RemoveParticipant(Guid drawId, Guid participantId)
    {
        try
        {
            _drawService.RemoveParticipant(drawId, participantId);
            var draw = _drawService.GetDrawById(drawId);
            return Ok(draw);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Exécuter le tirage au sort et sélectionner les gagnants.
    /// </summary>
    [HttpPost("{drawId}/execute")]
    public IActionResult ExecuteDraw(Guid drawId)
    {
        try
        {
            var draw = _drawService.ExecuteDraw(drawId);

            _logger.LogInformation(
                "Tirage exécuté: {DrawId} - {WinnerCount} gagnant(s)",
                drawId, draw.Winners.Count);

            return Ok(draw);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Supprimer un tirage au sort.
    /// </summary>
    [HttpDelete("{drawId}")]
    public IActionResult DeleteDraw(Guid drawId)
    {
        try
        {
            _drawService.DeleteDraw(drawId);

            _logger.LogInformation("Tirage supprimé: {DrawId}", drawId);

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
