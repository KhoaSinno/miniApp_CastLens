import { ImageResponse } from '@vercel/og';
export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = searchParams.get('payload') || '{}';
    
    let data;
    try {
      data = JSON.parse(decodeURIComponent(raw));
    } catch {
      data = {};
    }
    
    const title = data?.summary || (data?.unchanged ? 'Original' : 'Translation');
    const body = data?.translated || data?.eli5 || data?.summary || 'Processing...';

    return new ImageResponse(
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: 48,
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          fontSize: 36,
          fontWeight: 700,
          marginBottom: 16,
          color: '#1e293b'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 28,
          whiteSpace: 'pre-wrap',
          color: '#334155',
          lineHeight: 1.4
        }}>
          {body.slice(0, 300)}
        </div>
        {data?.key_points && (
          <div style={{
            marginTop: 24,
            fontSize: 20,
            color: '#64748b'
          }}>
            • {data.key_points.slice(0, 2).join(' • ')}
          </div>
        )}
      </div>,
      {
        width: 1200,
        height: 630
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    
    // Return fallback image
    return new ImageResponse(
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: 48,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          fontSize: 48,
          fontWeight: 700,
          color: '#1e293b'
        }}>
          CastLens Translator
        </div>
        <div style={{
          fontSize: 24,
          color: '#64748b',
          marginTop: 16
        }}>
          Translate and explain Farcaster casts
        </div>
      </div>,
      {
        width: 1200,
        height: 630
      }
    );
  }
}
