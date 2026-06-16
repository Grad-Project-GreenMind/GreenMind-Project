using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;

namespace GreenMind.Presentation.Controllers
{
    [ApiController]
    [Route("api/[controller]")] 
    [Authorize] 
    public class AIController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly ApplicationDbContext _context;

        public AIController(HttpClient httpClient, ApplicationDbContext context)
        {
            _httpClient = httpClient;
            _context = context;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) throw new UnauthorizedAccessException();
            return int.Parse(userIdClaim);
        }


        [AllowAnonymous] 
        [HttpPost("recommend-crop")]
        public async Task<IActionResult> GetCropRecommendation([FromBody] CropRecommendationDto input)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                string aiApiUrl = "https://tasnim777qutb-greenmind-crop-api.hf.space/predict";

                var response = await _httpClient.PostAsJsonAsync(aiApiUrl, input);

                if (!response.IsSuccessStatusCode)
                {
                    var aiErrorMessage = await response.Content.ReadAsStringAsync();
                    return BadRequest(new { message = "AI Validation Error", details = aiErrorMessage });
                }

                var result = await response.Content.ReadFromJsonAsync<JsonElement>();

                string aiMessage = "Unknown Crop Result";
                if (result.TryGetProperty("message", out var msgProperty))
                {
                    aiMessage = msgProperty.GetString() ?? "Unknown Crop Result";
                }

                var history = new UserActivityHistory
                {
                    UserId = GetUserId(),
                    Type = "crop",
                    Date = DateTime.Now.ToString("yyyy-MM-dd"),
                    Text = aiMessage,
                    Image = $"{Request.Scheme}://{Request.Host}/uploads/crop_default.png"
                };

                _context.UserActivityHistory.Add(history);
                await _context.SaveChangesAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error: {ex.Message}");
            }
        }
        [ProducesResponseType(typeof(FertilizerResponseDto), StatusCodes.Status200OK)]
        [HttpPost("recommend-fertilizer")]
        public async Task<IActionResult> GetFertilizerRecommendation([FromBody] FertilizerRecommendationDto input)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                string aiApiUrl = "https://tasnim777qutb-greenmind-fertilizer-api.hf.space/predict";

                var response = await _httpClient.PostAsJsonAsync(aiApiUrl, input);

                if (!response.IsSuccessStatusCode)
                {
                    var errorDetail = await response.Content.ReadAsStringAsync();
                    return BadRequest(new { message = "Fertilizer AI Error", details = errorDetail });
                }

                var result = await response.Content.ReadFromJsonAsync<FertilizerResponseDto>();

                var history = new UserActivityHistory
                {
                    UserId = GetUserId(), 
                    Type = "fertilizer",
                    Date = DateTime.Now.ToString("yyyy-MM-dd"),
                    Text = $"توصية سماد لـ {input.CropName}: {result?.Recommendation ?? "لا توجد بيانات"}",
                    Image = $"{Request.Scheme}://{Request.Host}/uploads/fertilizer_default.png"
                };

                _context.UserActivityHistory.Add(history);
                await _context.SaveChangesAsync();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error: {ex.Message}");
            }
        }

        [Authorize]
        [HttpPost("detect-disease")]
        public async Task<IActionResult> DetectDisease([FromForm] DiseaseDiagnosisDto input)
        {
            if (input.Images == null || !input.Images.Any())
                return Ok(new { error = "الصور مش واصلة للباك إيند. تأكدي من اختيار ملفات في Swagger" });

            var finalResults = new List<object>();
            string aiServerUrl = "https://myarr-plant-fastapi.hf.space/predict";
            string hfToken = "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";

            try
            {
                int userId = GetUserId();

                foreach (var file in input.Images)
                {
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                    var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

                    if (!Directory.Exists(uploadsPath))
                        Directory.CreateDirectory(uploadsPath);

                    var fullPath = Path.Combine(uploadsPath, fileName);
                    using (var stream = new FileStream(fullPath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    string imageUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";

                    using var content = new MultipartFormDataContent();
                    using var fileStream = file.OpenReadStream();
                    var fileContent = new StreamContent(fileStream);

                    content.Add(fileContent, "file", file.FileName);

                    using var request = new HttpRequestMessage(HttpMethod.Post, aiServerUrl);
                    request.Headers.Add("Authorization", $"Bearer {hfToken}");
                    request.Content = content;

                    _httpClient.Timeout = TimeSpan.FromMinutes(2);

                    var response = await _httpClient.SendAsync(request);

                    if (response.IsSuccessStatusCode)
                    {
                        var aiData = await response.Content.ReadFromJsonAsync<AIDetectionResponse>();

                        if (aiData != null)
                        {
                            var history = new UserActivityHistory
                            {
                                UserId = userId,
                                Type = "disease",
                                Date = DateTime.Now.ToString("yyyy-MM-dd"),
                                Image = imageUrl,
                                Text = $"Plant: {aiData.Plant}, Disease: {aiData.Disease}, Severity: {aiData.Severity ?? "N/A"}"
                            };

                            _context.UserActivityHistory.Add(history);

                            finalResults.Add(new
                            {
                                imageName = file.FileName,
                                diagnosis = aiData,
                                permanentImageUrl = imageUrl
                            });
                        }
                    }
                    else
                    {
                        var errorBody = await response.Content.ReadAsStringAsync();
                        finalResults.Add(new { imageName = file.FileName, error = "AI server error", details = errorBody });
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new { results = finalResults });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error: {ex.Message}");
            }
        }

        [HttpGet("user-ai-history/{type}")]
        public async Task<IActionResult> GetUserHistory(string type, [FromQuery] string userId)
        {
            try
            {
               
                if (!int.TryParse(userId, out int parsedUserId))
                {
                    return BadRequest(new { Message = "User ID must be a valid number" });
                }

                var history = await _context.UserActivityHistory
                    .Where(h => h.UserId == parsedUserId && h.Type == type) 
                    .OrderByDescending(h => h.Id)
                    .Select(h => new {
                        h.Id,
                        h.Text,
                        h.Date,
                        h.Image
                    })
                    .ToListAsync();

                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal error: {ex.Message}");
            }
        }
    }
}