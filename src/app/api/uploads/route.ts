import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ALLOWED_TYPES, uploadLimitBytes, uploadPrefix } from "@/features/deliverables/files";
import { getProjectForUpload } from "@/features/deliverables/queries";
import { uploadPayloadSchema } from "@/features/deliverables/schemas";
import { checkRole } from "@/lib/auth";

class Forbidden extends Error {}

// Vercel Blob client uploads: the browser asks here for a short-lived upload token, then sends
// the file straight to Blob. Only Owners and Team members of the project's workspace get one.
// There's no onUploadCompleted callback: the sendDeliverable Server Action saves the record.
export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const access = await checkRole("MEMBER");
        if (!access.ok) throw new Forbidden(access.error);

        const payload = uploadPayloadSchema.safeParse(JSON.parse(clientPayload ?? "null"));
        if (!payload.success) throw new Forbidden("Choose a project first.");

        const project = await getProjectForUpload(payload.data.projectId, access.orgId);
        if (!project) throw new Forbidden("This project isn't in your workspace.");
        if (!pathname.startsWith(uploadPrefix(access.orgId, project.id))) throw new Forbidden("Wrong upload folder.");

        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: uploadLimitBytes(access.orgId),
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Forbidden) return NextResponse.json({ error: error.message }, { status: 403 });
    return NextResponse.json({ error: "The upload couldn't start. Please try again." }, { status: 400 });
  }
}
