using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GreenMind.Service.Authentication.Services
{
    public class UserActivityLogger : IUserActivityLogger
    {
        private readonly ApplicationDbContext _context;

        public UserActivityLogger(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(string userName, string actionType)
        {
            _context.UserActivityLogs.Add(new UserActivityLog
            {
                UserName = userName,
                ActionType = actionType,
                StartedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
    }
}
