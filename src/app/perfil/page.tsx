import { redirect } from 'next/navigation'
/** Rota legada: a gestão privada do perfil vive apenas em /conta/perfil. */
export default function PerfilLegadoPage(){ redirect('/conta/perfil') }
