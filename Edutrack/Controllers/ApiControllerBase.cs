// ============================================================================
// FILE:    Controllers/ApiControllerBase.cs
// PURPOSE: Base class for every API controller.
//          ARCHITECTURE: Controller -> Service -> Repository.
//            - Controllers only read the request, call ONE service method, and return Respond(result).
//            - Services (Services/) hold all business rules.
//            - Repositories (Repositories/) hold all database queries and updates.
// ============================================================================

using Edutrack.Services;
using Microsoft.AspNetCore.Mvc;

namespace Edutrack.Controllers
{
    [ApiController]
    public abstract class ApiControllerBase : ControllerBase
    {
        // The logged-in user (id + role from the JWT), passed to the service layer.
        protected Caller Caller => User.ToCaller();

        // Turns a service result into the HTTP response: 200 / 201 with the value, or the error as { error }.
        protected IActionResult Respond<T>(ServiceResult<T> result)
        {
            if (result.Error is { } e)
            {
                var body = new { error = e.Message };
                return e.Kind switch
                {
                    ErrorKind.BadRequest => BadRequest(body),
                    ErrorKind.Unauthorized => Unauthorized(body),
                    ErrorKind.Forbidden => StatusCode(StatusCodes.Status403Forbidden, body),
                    ErrorKind.NotFound => NotFound(body),
                    ErrorKind.Conflict => Conflict(body),
                    ErrorKind.Locked => StatusCode(StatusCodes.Status423Locked, body),
                    _ => StatusCode(StatusCodes.Status500InternalServerError, body),
                };
            }
            return result.CreatedLocation is { } location ? Created(location, result.Value) : Ok(result.Value);
        }
    }
}
