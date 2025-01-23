import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';

export async function GET() {
    try {
        const files = fs.readdirSync('./documents');
        return NextResponse.json(files);
    } catch (error) {
        return NextResponse.json(
            { err: 'Failed to read files',error },
            { status: 500 }
        );
    }
}