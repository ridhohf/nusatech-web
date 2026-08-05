'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/api/client';

export default function ClientHistoryPage() {
  const [inspections, setInspections] = useState([]);

  useEffect(() => {
    apiClient.get('/inspections').then(res => {
      const finished = res.data.filter((i: any) => i.status === 'FINISH');
      setInspections(finished);
    }).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Riwayat Perbaikan</h1>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Pekerjaan</th>
                <th>Kategori</th>
                <th>PIC</th>
                <th>Material</th>
                <th>Tanggal Selesai</th>
                <th>Status</th>
                <th>Bukti</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((ins: any) => (
                <tr key={ins.id}>
                  <td style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue-900)' }}>
                    {ins.projectCode || `${ins.company?.code || '6501'}-${ins.scopeCode || '10'}${ins.equipmentCode || '10'}`}
                  </td>
                  <td><span className="badge badge-blue">{ins.kategoriPerbaikan}</span></td>
                  <td>{ins.pic?.name}</td>
                  <td>{ins.items?.length || 0} item</td>
                  <td>{new Date(ins.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                  <td><span className="badge badge-green">FINISH</span></td>
                  <td>
                    {ins.fotoBukti ? (
                      <a href={ins.fotoBukti} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-600)', textDecoration: 'underline', fontSize: '0.875rem' }}>Lihat Foto</a>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
              {inspections.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Belum ada pekerjaan yang selesai</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
