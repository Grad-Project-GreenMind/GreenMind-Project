using GreenMind.Domain.Entities;
using GreenMind.Presistance.Data.DbContexts;
using GreenMind.ServiceAbstraction.Interfaces; // تأكد من المسار الصحيح للـ Interface بتاعك
using Microsoft.EntityFrameworkCore; // ضروري جداً عشان AnyAsync تشتغل
using System;
using System.Threading.Tasks;

namespace GreenMind.Presistance.Data.DataSeed
{
    // 1. تأكد أنها public عشان تقدر تشوفها من الـ Program.cs
    public class AdminSeed
    {
        public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasherService hasher)
        {
            // استخدمي الإيميل اللي إحنا لسه مجربينه ونفع
            var adminEmail = "testadmin@gmail.com";

            var exists = await context.Admins.AnyAsync(a => a.Email == adminEmail);

            if (!exists)
            {
                var admin = new Admin
                {
                    Name = "Test Admin",
                    Email = adminEmail,
                    // تأكدي إن الميثود اسمها HashPassword أو Hash حسب الـ Interface عندك
                    Password = hasher.Hash("Password123!"),
                    CreatedDate = DateTime.Now // ضيفي دي عشان الجدول ميزعلش
                };

                await context.Admins.AddAsync(admin);
                await context.SaveChangesAsync();
            }
        }
    }
}