import { Building2 } from 'lucide-react'
import type { InstitutionOverview } from '../../lib/institutionalDashboards'

export function InstitutionCard({ institution }: { institution: InstitutionOverview }) {
  return <article className="surface institution-card">
    <div className="institution-card-icon"><Building2 size={22} aria-hidden="true" /></div>
    <h2>{institution.name}</h2>
    <p>{institution.campusCount} campus · {institution.programCount} {institution.programCount === 1 ? 'programa' : 'programas'}</p>
    <div className="institution-card-participation"><span>Participación</span><strong>{institution.participation}%</strong></div>
    <div className="progress-track" role="meter" aria-label={'Participación de ' + institution.name} aria-valuenow={institution.participation} aria-valuemin={0} aria-valuemax={100}><span style={{ width: institution.participation + '%' }} /></div>
  </article>
}
