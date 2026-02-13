"use client"

import { useState } from 'react'
import {
  MdSearch,
  MdSort,
  MdFilterList,
  MdOpenInNew,
} from 'react-icons/md'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const departments = [
  'Animal Bite',
  'Cardiology',
  'Dental',
  'EC',
  'ENT',
  'Eye Care',
  'Fam Med',
  'Geriatric Med',
  'IM Nephrology',
  'Internal Med',
  'Laboratory',
  'LC Adult',
]

// Mock user role - in real app, fetch from auth context/session
const userRole = 'admin' // 'admin' | 'user'

export default function ReleasingClient() {
  const [searchQuery, setSearchQuery] = useState('')

  const isAdmin = userRole === 'admin'

  return (
    <>
      {/* Admin UI */}
      {isAdmin && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-800">Ticket Releasing</h2>
              <p className="text-sm text-muted-foreground">Manage and release tickets by department</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 w-[420px]">
                <Input
                  placeholder="Search departments, clinics or services....."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button variant="outline" size="sm">
                  <MdSearch />
                </Button>
              </div>

              <Button variant="outline" size="sm">
                <MdSort />
                <span className="ml-1">Sort</span>
              </Button>

              <Button variant="outline" size="sm">
                <MdFilterList />
                <span className="ml-1">Filter</span>
              </Button>

              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="/avatar.png" alt="user" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-sm text-emerald-700">All Departments</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {Array.from({ length: 20 }).map((_, idx) => {
              const name = departments[idx % departments.length]
              return (
                <Card key={idx} className="overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-2 h-12 rounded bg-emerald-600" />
                    <div className="flex-1">
                      <CardHeader className="p-0">
                        <CardTitle className="font-semibold text-sm text-emerald-900">{name}</CardTitle>
                        <div className="text-xs text-muted-foreground">Tickets Released: 01</div>
                      </CardHeader>
                    </div>

                    <div className="flex-shrink-0">
                      <CardContent className="p-0">
                        <Button variant="ghost" size="icon" className="bg-emerald-50 hover:bg-emerald-100">
                          <MdOpenInNew className="text-emerald-700" />
                        </Button>
                      </CardContent>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Regular User UI */}
      {!isAdmin && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Card className="w-full max-w-md p-6">
            <CardHeader>
              <CardTitle className="text-center text-emerald-800">Ticket Request</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground text-center">Select a department to request a ticket</p>

              <div className="flex flex-col gap-2">
                {departments.map((dept) => (
                  <Button
                    key={dept}
                    variant="outline"
                    className="w-full justify-start text-left hover:bg-emerald-50"
                  >
                    {dept}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
