using GreenMind.ServiceAbstraction.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.ServiceAbstraction.Interfaces
{
    public interface IUserService
    {
        Task<UserProfileDto> GetProfileAsync(int userId);

        Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateUserProfileDto dto);

        Task<string> ChangePasswordAsync(int userId, ChangePasswordDto dto);
    }
}
