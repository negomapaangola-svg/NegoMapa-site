import { redirect } from 'next/navigation'
/** Rota legada: não manter um segundo editor de perfil. */
export default function EditarPerfilLegadoPage(){ redirect('/conta/perfil') }
