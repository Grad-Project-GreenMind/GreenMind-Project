using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace GreenMind.Domain.Entities
{
    // 1. تعريف الـ Enum لحالات الطلب عشان نمنع الأخطاء اليدوية
    public enum OrderStatus
    {
        Pending,    // قيد الانتظار
        Confirmed,  // تم التأكيد
        Shipped,    // تم الشحن
        Delivered,  // تم التوصيل
        Cancelled   // ملغي
    }

    public class Order : BaseEntity
    {
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;

        // 2. التعديل: استبدال الـ string بـ Enum والقيمة الافتراضية هي Pending
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal DiscountAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public string PaymentMethod { get; set; } = "Cash on delivery";

        public string Phone { get; set; } = null!;

        public string? Notes { get; set; }

        // العلاقات (Relationships)
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int AddressId { get; set; }
        public Address Address { get; set; } = null!;

        public ICollection<OrderItem> OrderItems { get; set; } = new HashSet<OrderItem>();
    }
}