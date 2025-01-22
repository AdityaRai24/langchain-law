import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';

export async function GET(request: NextRequest) {
    try {
        const files = fs.readdirSync('./documents');
        return NextResponse.json(files);
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to read files' },
            { status: 500 }
        );
    }
}