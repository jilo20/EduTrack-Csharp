using Edutrack.Data;
using Edutrack.Dtos;
using Edutrack.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Edutrack.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    public class RegisteredIdController: ControllerBase
    {
        private readonly EduTrackContext _dbContext;

        
        public RegisteredIdController(EduTrackContext dbContext)
        {
            this._dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var registeredids = await _dbContext.RegisteredIds
                                                .Select(b => new RegisteredIdDto(b.Id, b.IdNumber, b.Role!.Name, b.IsUsed, b.CreatedAt))
                                                .ToListAsync();

            return Ok(registeredids);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetId(int id)
        {
            var registeredids = await _dbContext.RegisteredIds
                                                .Where(b => b.Id == id)
                                                .ToListAsync();
            return Ok(registeredids);
        }

    }
}
