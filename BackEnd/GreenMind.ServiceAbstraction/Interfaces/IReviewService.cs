using GreenMind.ServiceAbstraction.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface IReviewService
    {
        Task AddReviewAsync(CreateReviewDto dto);

        Task<List<ReviewResponseDto>> GetReviewsAsync(int? limit);
    }
}