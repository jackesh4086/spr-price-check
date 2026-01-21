'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';

const stores = [
  { id: 1, name: 'SPR Repair - KLCC', address: 'Lot 123, Level 2, Suria KLCC', phone: '+60312345678', hours: '10am - 10pm' },
  { id: 2, name: 'SPR Repair - Mid Valley', address: 'Lot 456, Level 3, Mid Valley Megamall', phone: '+60398765432', hours: '10am - 10pm' },
  { id: 3, name: 'SPR Repair - 1 Utama', address: 'Lot 789, Level 1, 1 Utama Shopping Centre', phone: '+60377778888', hours: '10am - 10pm' },
  { id: 4, name: 'SPR Repair - Pavilion', address: 'Lot 321, Level 4, Pavilion KL', phone: '+60321234567', hours: '10am - 10pm' },
  { id: 5, name: 'SPR Repair - Sunway Pyramid', address: 'Lot 654, Level 2, Sunway Pyramid', phone: '+60356789012', hours: '10am - 10pm' },
];

export default function StoresPage() {
  const router = useRouter();

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Find a Store</h1>
        <p className="text-gray-600">Visit any of our locations for your repair</p>
      </div>

      <div className="space-y-4">
        {stores.map((store) => (
          <Card key={store.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{store.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {store.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {store.hours}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <button onClick={() => router.back()} className="mt-6 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Quote
      </button>
    </div>
  );
}
