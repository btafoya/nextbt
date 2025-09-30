"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export type Project = {
  id: number
  name: string
  description: string
  status: number
  enabled: number
}

const statusLabels: Record<number, string> = {
  10: "Development",
  30: "Release",
  50: "Stable",
  70: "Obsolete"
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <Link href={`/projects/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
          #{row.getValue("id")}
        </Link>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-white hover:bg-blue-500 hover:text-white"
        >
          Project Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <Link href={`/projects/${row.original.id}`} className="hover:underline font-medium">
          {row.getValue("name")}
        </Link>
      )
    },
  },
  {
    accessorKey: "description",
    header: () => <span className="text-white font-semibold">Description</span>,
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      // Strip HTML tags for display in table
      const plainText = description ? description.replace(/<[^>]*>/g, '').trim() : ''
      return (
        <div className="max-w-md truncate" title={plainText}>
          {plainText || <span className="text-gray-400 italic">No description</span>}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
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
      const status = row.getValue("status") as number
      const label = statusLabels[status] || "Unknown"
      const colorClass =
        status === 10 ? "bg-blue-100 text-blue-800" :
        status === 30 ? "bg-yellow-100 text-yellow-800" :
        status === 50 ? "bg-green-100 text-green-800" :
        "bg-gray-100 text-gray-800"

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
          Enabled
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
          {enabled ? "Yes" : "No"}
        </span>
      )
    },
  },
]