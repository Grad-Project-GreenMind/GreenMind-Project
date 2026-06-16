using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.Interfaces; 
using Microsoft.EntityFrameworkCore; 
using System;
using System.Threading.Tasks;

namespace GreenMind.Presistance.Data.DataSeed
{
    public class AdminSeed
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasherService hasher)
        {
            var adminEmail = "testadmin@gmail.com";

            var exists = await context.Admins.AnyAsync(a => a.Email == adminEmail);

            if (!exists)
            {
                var admin = new Admin
                {
                    Name = "Test Admin",
                    Email = adminEmail,
                    Password = hasher.Hash("Password123!"),
                    CreatedDate = DateTime.Now 
                };

                await context.Admins.AddAsync(admin);
                await context.SaveChangesAsync();
            }
        }
    }
}