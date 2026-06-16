using Microsoft.AspNetCore.Identity;
using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GreenMindAI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "User")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        private int GetUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                throw new Exception("Invalid token");

            return int.Parse(userId);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var result = await _userService.GetProfileAsync(GetUserId());
            return Ok(result);
        }
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateUserProfileDto dto)
        {
            var result = await _userService.UpdateProfileAsync(GetUserId(), dto);
            return Ok(new
            {
                message = "Profile updated successfully.",
                data = result
            });
        }

        [HttpPost("/api/Auth/change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var message = await _userService.ChangePasswordAsync(GetUserId(), dto);
            return Ok(new { message });
        }
    }
}