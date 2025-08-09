import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBike } from '../utils/bikesApi';

export default function BikeDetail() {
  const { id } = useParams();
  const [bike, setBike] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(`/bikes/${id}`)}`);
      return;
    }
    (async () => {
      try {
        const data = await getBike(id);
        setBike(data);
      } catch (e) {
        // 404
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <div className="page-pad">Načítám…</div>;
  if (!bike) return <div className="page-pad">Kolo nenalezeno. <Link to="/my-bikes">Zpět</Link></div>;

  return (
    <div className="page-pad">
      <h1>{bike.title}</h1>
      <img style={{maxWidth:300}} src={bike.imageUrl || '/logo512.png'} alt={bike.title} />
      <p><b>Model:</b> {bike.model || '—'}</p>
      <p><b>Rok:</b> {bike.year || '—'}</p>
      <p><b>Odjeté minuty:</b> {bike.minutesRidden}</p>
      <p><b>Typ:</b> {bike.type || '—'}</p>
      <p><b>Brzdy:</b> {bike.brakes || '—'}</p>
      <p><b>Odpružení:</b> {bike.suspension || '—'}</p>
      <p><b>Specifikace:</b> {bike.specs || '—'}</p>
      <div style={{marginTop:16}}>
        <Link to={`/bikes/${id}/edit`}>Upravit</Link> | <Link to="/my-bikes">Zpět</Link>
      </div>
    </div>
  );
}
