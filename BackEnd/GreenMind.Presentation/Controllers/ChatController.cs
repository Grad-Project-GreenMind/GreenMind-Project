using GreenMind.ServiceAbstraction.DTOs;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System.Threading.Tasks;

namespace GreenMind.Controllers
{
    [EnableCors("AllowAll")]
    [ApiController]
    [Route("chat")]
    [Authorize] 
    public class ChatController : ControllerBase
    {
        private readonly IChatService _chatService;
        private readonly IConfiguration _configuration;

        public ChatController(IChatService chatService, IConfiguration configuration)
        {
            _chatService = chatService;
            _configuration = configuration;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized(new { Message = "يجب تسجيل الدخول أولاً." });
            }

            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { Message = "الرسالة لا يمكن أن تكون فارغة." });
            }

            var chatUrl = _configuration["AiSettings:ChatUrl"];

            var response = await _chatService.ProcessMessageAsync(request, chatUrl, userId);

            if (response.Status == "error")
            {
                return StatusCode(500, response);
            }

            return Ok(response);
        }

        [HttpGet("history/{userId}")] 
        public IActionResult GetHistory(string userId) 
        {
            

            if (string.IsNullOrWhiteSpace(userId))
                return BadRequest(new { Message = "User ID is required" });

            var response = _chatService.GetUserHistory(userId);
            return Ok(response);
        }

        [HttpPost("new")]
        public IActionResult CreateNewChat([FromBody] CreateNewChatRequest request)
        {  
             var userIdFromToken = User.FindFirstValue(ClaimTypes.NameIdentifier);
            string validUserId = userIdFromToken ??
                                ((string.IsNullOrWhiteSpace(request.UserId) || request.UserId == "string") ? "6" : request.UserId);

            var response = _chatService.CreateNewChat(validUserId);
            return Ok(response);
        }

        [HttpGet("generate-title/{sessionId}")]
        public async Task<IActionResult> GenerateTitle(string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId) || sessionId == "string")
                return BadRequest(new { Message = "SessionId غير صحيح." });

            var titleUrl = _configuration["AiSettings:TitleUrl"];

            var result = await _chatService.GenerateChatTitleAsync(sessionId, titleUrl);
            return Ok(result);
        }
    }
}