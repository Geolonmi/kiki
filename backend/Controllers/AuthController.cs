using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;
using System.Security.Claims;

namespace TirageAuSort.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuthController : ControllerBase
{
    /// <summary>
    /// Retourne les informations de l'utilisateur connecté
    /// extraites du token JWT Entra ID.
    /// </summary>
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var displayName = User.FindFirstValue("name")
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? "Inconnu";

        var email = User.FindFirstValue("preferred_username")
            ?? User.FindFirstValue(ClaimTypes.Email)
            ?? "Inconnu";

        var objectId = User.GetObjectId();

        var roles = User.FindAll(ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        return Ok(new
        {
            DisplayName = displayName,
            Email = email,
            ObjectId = objectId,
            Roles = roles
        });
    }
}
