using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GreenMind.ServiceAbstraction.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;
namespace GreenMind.Service.Authentication.Services
{
  

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var fromEmail = _config["EmailSettings:FromEmail"];
            var appPassword = _config["EmailSettings:AppPassword"];
            var host = _config["EmailSettings:Host"];
            var port = int.Parse(_config["EmailSettings:Port"]!);

            var smtp = new SmtpClient(host, port)
            {
                EnableSsl = true,
                Credentials = new NetworkCredential(fromEmail, appPassword)
            };

            var msg = new MailMessage(fromEmail!, toEmail, subject, body);
            await smtp.SendMailAsync(msg);
        }
    }
}
