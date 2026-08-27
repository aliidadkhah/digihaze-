// components/ContactInfoCards.tsx
import { Clock, Phone, MapPin } from 'lucide-react';

const contactItems = [
  {
    icon: Clock,
    title: 'ساعت کاری',
    detail: 'همه روزه ۸ صبح الی ۸ شب',
  },
  {
    icon: Phone,
    title: 'پشتیبانی',
    detail: '۰۹۳۰۱۱۶۲۵۷۳', // اگه شماره دیجی‌هیز فرق داره جایگزین کنید
  },
  {
    icon: MapPin,
    title: 'آدرس',
    detail: 'تبریز، مرزداران، خیابان بهارستان',
  },
];

export default function ContactInfoCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {contactItems.map(({ icon: Icon, title, detail }) => (
        <div
          key={title}
          className="flex flex-col items-center text-center rounded-xl border p-8 transition-colors hover:border-[var(--color-primary,#2F86FF)]"
          style={{
            backgroundColor: 'var(--color-surface, #17181C)',
            borderColor: 'var(--color-border, #2A2B31)',
          }}
        >
          <Icon
            size={40}
            style={{ color: 'var(--color-primary, #2F86FF)' }}
            className="mb-4"
          />
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-300" dir="rtl">
            {detail}
          </p>
        </div>
      ))}
    </div>
  );
}
