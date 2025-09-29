"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export type User = {
  id: number
  username: string
  realname: string
  email: string
  enabled: number
  protected: number
  access_level: number
  last_visit: number
}

function getAccessLevelLabel(level: number): string {
  if (level >= 90) return "Administrator";
  if (level >= 70) return "Manager";
  if (level >= 55) return "Developer";
  if (level >= 40) return "Updater";
  if (level >= 25) return "Reporter";
  return "Viewer";
}

function getAccessLevelColor(level: number): string {
  if (level >= 90) return "bg-red-100 text-red-800";
  if (level >= 70) return "bg-purple-100 text-purple-800";
  if (level >= 55) return "bg-blue-100 text-blue-800";
  if (level >= 40) return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const isProtected = row.original.protected === 1
      return (
        <div className="flex items-center gap-2">
          <Link 
            href={`/users/${row.original.id}/edit`} 
            className="font-medium hover:underline"
          >
            {row.getValue("username")}
          </Link>
          {isProtected && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Protected
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "realname",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          Real Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const realname = row.getValue("realname") as string
      return realname || <span className="text-gray-400 italic">-</span>
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "access_level",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          Access Level
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const level = row.getValue("access_level") as number
      const label = getAccessLevelLabel(level)
      const colorClass = getAccessLevelColor(level)

      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
          {label}
        </span>
      )
    },
  },
  {
    accessorKey: "enabled",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const enabled = row.getValue("enabled") as number
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {enabled ? "Enabled" : "Disabled"}
        </span>
      )
    },
  },
  {
    accessorKey: "last_visit",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          Last Visit
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const lastVisit = row.getValue("last_visit") as number
      return lastVisit 
        ? new Date(lastVisit * 1000).toLocaleDateString()
        : <span className="text-gray-400 italic">Never</span>
    },
  },
  {
    id: "actions",
    header: () => <span className="text-white font-semibold">Actions</span>,
    cell: ({ row }) => {
      const isProtected = row.original.protected === 1
      return (
        <div className="flex gap-2">
          <Link
            href={`/users/${row.original.id}/edit`}
            className="text-blue-600 hover:text-blue-900 text-sm"
          >
            Edit
          </Link>
          {!isProtected && (
            <Link
              href={`/users/${row.original.id}/delete`}
              className="text-red-600 hover:text-red-900 text-sm"
            >
              Delete
            </Link>
          )}
        </div>
      )
    },
  },
]
