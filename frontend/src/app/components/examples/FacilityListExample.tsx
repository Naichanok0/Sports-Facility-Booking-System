import { useEffect, useState } from 'react';
import { facilityAPI, sportTypeAPI } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface Facility {
  _id: string;
  name: string;
  location: string;
  maxCapacity: number;
  pricePerHour: number;
  isActive: boolean;
  operatingHours: {
    openTime: string;
    closeTime: string;
  };
  sportTypeId: {
    _id: string;
    name: string;
  };
}

export function FacilityListExample() {
  const { data: facilitiesResponse, loading, error } = useApi(() =>
    facilityAPI.getAll()
  );

  const facilities: Facility[] = facilitiesResponse?.data || [];

  if (loading) return <div className="p-4">Loading facilities...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Available Facilities</h1>
        <p className="text-gray-600">Choose a facility to make a reservation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map((facility) => (
          <Card key={facility._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{facility.name}</CardTitle>
                  <CardDescription>{facility.location}</CardDescription>
                </div>
                {facility.isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Sport Type:</span>
                  <span className="text-sm">{facility.sportTypeId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Capacity:</span>
                  <span className="text-sm">{facility.maxCapacity} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-sm font-semibold">
                    {facility.pricePerHour} THB/hour
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Hours:</span>
                  <span className="text-sm">
                    {facility.operatingHours.openTime} - {facility.operatingHours.closeTime}
                  </span>
                </div>
              </div>
              <Button className="w-full mt-4">View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
