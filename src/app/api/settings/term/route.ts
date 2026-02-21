import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { prisma } from "@/lib/prisma";

// GET - Fetch all term settings
export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const termSettings = await prisma.termSetting.findMany({
			orderBy: [{ year: "desc" }, { term: "asc" }],
		});

		return NextResponse.json({ termSettings });
	} catch (error) {
		console.error("Error fetching term settings:", error);
		return NextResponse.json({ error: "Failed to fetch term settings" }, { status: 500 });
	}
}

// POST - Save/Update term settings (GM only)
export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);

		console.log("Session in POST:", session);

		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (session.user.role !== "GM") {
			return NextResponse.json(
				{
					error: "Only GMs can update term settings",
					receivedRole: session.user.role,
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { termSettings } = body;

		if (!Array.isArray(termSettings)) {
			return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
		}

		// Validate each setting
		for (const setting of termSettings) {
			if (!setting.term || !setting.year || !setting.startDate || !setting.endDate) {
				return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
			}

			if (new Date(setting.startDate) >= new Date(setting.endDate)) {
				return NextResponse.json(
					{ error: `Term ${setting.term} ${setting.year}: Start date must be before end date` },
					{ status: 400 }
				);
			}
		}

		// Upsert all settings
		const results = await Promise.all(
			termSettings.map((setting) =>
				prisma.termSetting.upsert({
					where: {
						term_year: {
							term: setting.term,
							year: setting.year,
						},
					},
					update: {
						startDate: new Date(setting.startDate),
						endDate: new Date(setting.endDate),
						weeksCount: setting.weeksCount || 13,
					},
					create: {
						term: setting.term,
						year: setting.year,
						startDate: new Date(setting.startDate),
						endDate: new Date(setting.endDate),
						weeksCount: setting.weeksCount || 13,
					},
				})
			)
		);

		return NextResponse.json({
			success: true,
			message: "Term settings saved successfully",
			termSettings: results,
		});
	} catch (error) {
		console.error("Error saving term settings:", error);
		return NextResponse.json({ error: "Failed to save term settings" }, { status: 500 });
	}
}
