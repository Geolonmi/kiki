using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TirageAuSort.Api.Models;
using TirageAuSort.Api.Services;

namespace TirageAuSort.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupController(IGroupService groupService, ILogger<GroupController> logger) : ControllerBase
{
    private readonly IGroupService _groupService = groupService;
    private readonly ILogger<GroupController> _logger = logger;

    /// <summary>
    /// Récupérer tous les groupes de participant·e·s.
    /// </summary>
    [HttpGet]
    public IActionResult GetAllGroups()
    {
        try
        {
            var groups = _groupService.GetAllGroups();
            return Ok(groups);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération des groupes");
            return StatusCode(500, "Erreur interne");
        }
    }

    /// <summary>
    /// Récupérer un groupe par son identifiant.
    /// </summary>
    [HttpGet("{id:guid}")]
    public IActionResult GetGroupById(Guid id)
    {
        try
        {
            var group = _groupService.GetGroupById(id);
            if (group == null) return NotFound($"Groupe {id} non trouvé");
            return Ok(group);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la récupération du groupe {Id}", id);
            return StatusCode(500, "Erreur interne");
        }
    }

    /// <summary>
    /// Créer un nouveau groupe.
    /// </summary>
    [HttpPost]
    public IActionResult CreateGroup([FromBody] CreateGroupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Le nom du groupe est obligatoire");

        try
        {
            var group = _groupService.CreateGroup(request);
            return CreatedAtAction(nameof(GetGroupById), new { id = group.Id }, group);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la création du groupe");
            return StatusCode(500, "Erreur interne");
        }
    }

    /// <summary>
    /// Modifier un groupe existant.
    /// </summary>
    [HttpPut("{id:guid}")]
    public IActionResult UpdateGroup(Guid id, [FromBody] CreateGroupRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Le nom du groupe est obligatoire");

        try
        {
            var group = _groupService.UpdateGroup(id, request);
            return Ok(group);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la modification du groupe {Id}", id);
            return StatusCode(500, "Erreur interne");
        }
    }

    /// <summary>
    /// Supprimer un groupe.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public IActionResult DeleteGroup(Guid id)
    {
        try
        {
            _groupService.DeleteGroup(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la suppression du groupe {Id}", id);
            return StatusCode(500, "Erreur interne");
        }
    }
}
