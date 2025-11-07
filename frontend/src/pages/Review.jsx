import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function ReviewPage() {
  const { token } = useParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'https://reservation-backend-demo.onrender.com';


  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token || rating < 1 || rating > 10) {
      setError('Please pick a rating 1–10.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/submit`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          token,
          rating: Number(rating),
          comment: comment.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to submit review');
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="container pt-24 md:pt-28" style={{maxWidth: 520, margin: '40px auto', textAlign: 'center'}}>
        <h2>Thanks for your feedback! 💙</h2>
        <p>Your review was recorded.</p>
      </div>
    );
  }

  return (
    <div className="container pt-24 md:pt-28" style={{maxWidth: 520, margin: '40px auto'}}>
      <h2 style={{marginBottom: 12}}>Rate your dinner (1–10)</h2>
      <form onSubmit={submit}>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', margin:'12px 0'}}>
          {Array.from({length:10}, (_,i)=>i+1).map(n=>(
            <button
              key={n}
              type="button"
              onClick={()=>setRating(n)}
              disabled={submitting}
              style={{
                padding:'10px 14px',
                borderRadius:8,
                border: n===rating ? '2px solid black' : '1px solid #ccc',
                cursor:'pointer',
                background: n===rating ? '#eee' : 'white'
              }}
            >
              {n}
            </button>
          ))}
        </div>

        <label style={{display:'block', marginTop:12}}>Comment (optional)</label>
        <textarea
          value={comment}
          onChange={e=>setComment(e.target.value)}
          rows={4}
          placeholder="Tell us more (optional)"
          disabled={submitting}
          style={{width:'100%', padding:10, borderRadius:8, border:'1px solid #ccc'}}
        />

        {error && <p style={{color:'crimson', marginTop:10}}>{error}</p>}

        <button
          type="submit"
          disabled={submitting || rating===0}
          style={{marginTop:16, padding:'12px 16px', borderRadius:8, border:'none', background:'#0C6DAE', color:'#fff'}}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
      </form>
    </div>
  );
}
