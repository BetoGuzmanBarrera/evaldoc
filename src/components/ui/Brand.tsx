import { Link } from 'react-router-dom'
export function Brand({ inverse = false }: { inverse?: boolean }) {
  return <Link to="/" className={`brand ${inverse ? 'brand-inverse' : ''}`} aria-label="EvalDoc, ir a inicio"><span className="brand-mark" aria-hidden="true" /><span>EvalDoc</span></Link>
}
