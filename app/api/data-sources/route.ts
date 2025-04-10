import { NextResponse } from "next/server"
import { dataManager } from "@/lib/data-manager"
import { getAvailableDataSources } from "@/lib/data-sources"

/**
 * GET handler to retrieve data sources
 */
export async function GET() {
  const dataSources = dataManager.getDataSources()
  const availableSources = getAvailableDataSources()

  return NextResponse.json({
    dataSources: dataSources.map((ds) => ({
      id: ds.id,
      name: ds.source.name,
      description: ds.source.description,
      status: ds.source.getStatus(),
      active: ds.active,
      config: ds.source.getConfiguration(),
    })),
    availableSources,
  })
}

/**
 * POST handler to add a new data source
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, type, config } = body

    if (!id || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await dataManager.addDataSource(id, type, config)

    if (result) {
      return NextResponse.json({ success: true, id })
    } else {
      return NextResponse.json({ error: "Failed to add data source" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error adding data source:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

/**
 * PUT handler to update a data source
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, action, config } = body

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let result = false

    switch (action) {
      case "start":
        result = await dataManager.startDataSource(id)
        break
      case "stop":
        result = await dataManager.stopDataSource(id)
        break
      case "setActive":
        result = await dataManager.setActiveDataSource(id)
        break
      case "updateConfig":
        if (!config) {
          return NextResponse.json({ error: "Missing config" }, { status: 400 })
        }
        result = await dataManager.updateDataSourceConfig(id, config)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (result) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Operation failed" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error updating data source:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

/**
 * DELETE handler to remove a data source
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing data source ID" }, { status: 400 })
    }

    const result = await dataManager.removeDataSource(id)

    if (result) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to remove data source" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error removing data source:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
