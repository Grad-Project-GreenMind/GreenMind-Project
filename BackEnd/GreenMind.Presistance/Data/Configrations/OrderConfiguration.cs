using GreenMind.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GreenMind.Presistance.Data.Configrations
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.HasOne(o => o.Address)
                   .WithMany()
                   .HasForeignKey(o => o.AddressId)
                   .OnDelete(DeleteBehavior.NoAction);

            
            builder.Property(o => o.SubTotal)
                   .HasColumnType("decimal(18,2)");

            builder.Property(o => o.DiscountAmount)
                   .HasColumnType("decimal(18,2)");

            builder.Property(o => o.ShippingCost)
                   .HasColumnType("decimal(18,2)");

            builder.Property(o => o.TaxAmount)
                   .HasColumnType("decimal(18,2)");

            builder.Property(o => o.TotalAmount)
                   .HasColumnType("decimal(18,2)");
        }
    }
}