import { NextResponse,type NextRequest } from 'next/server';
import { allyIdFromRequest } from '@/lib/allyAuth';
import { getAllyById,publicAlly,readAlliesData } from '@/lib/allies';
export async function GET(request:NextRequest){const id=allyIdFromRequest(request);if(!id)return NextResponse.json({error:'No autorizado.'},{status:401});const me=await getAllyById(id);if(!me||me.status!=='approved'||me.must_change_password)return NextResponse.json({error:'Completa primero la activación de tu cuenta.'},{status:403});const data=await readAlliesData();return NextResponse.json(data.allies.filter(a=>a.status==='approved'&&a.visible&&a.id!==id).sort((a,b)=>a.business_name.localeCompare(b.business_name)).map(publicAlly))}
