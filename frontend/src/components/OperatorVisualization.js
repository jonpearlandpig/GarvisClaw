import React, { useEffect, useRef, useState } from 'react';
import './OperatorVisualization.css';

const OperatorVisualization = ({ operators, executions }) => {
  const containerRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 20, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeOperators = new Set(
    executions.filter(e => e.status === 'running').map(e => e.operator_type)
  );

  const operatorColors = {
    browser: '#3b82f6',
    file: '#10b981',
    system: '#f59e0b',
    api: '#8b5cf6',
    ai: '#ec4899'
  };

  // Auto-rotate
  useEffect(() => {
    if (!isDragging) {
      const interval = setInterval(() => {
        setRotation(prev => ({ ...prev, y: (prev.y + 0.3) % 360 }));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isDragging]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      setRotation(prev => ({
        x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.3)),
        y: (prev.y + deltaX * 0.3) % 360
      }));
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      
      setRotation(prev => ({
        x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.3)),
        y: (prev.y + deltaX * 0.3) % 360
      }));
      
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Arrange operators in a circle (smaller radius on mobile)
  const getPosition = (index, total) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = isMobile ? 120 : 200;
    const verticalSpread = isMobile ? 40 : 80;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(index * 0.5) * verticalSpread,
      z: Math.sin(angle) * radius
    };
  };

  return (
    <div 
      ref={containerRef}
      className="operator-viz-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="operator-viz-scene"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
        }}
      >
        {/* Central Hub */}
        <div className="operator-hub">
          <div className="hub-sphere"></div>
          <div className="hub-label">GARVIS</div>
        </div>

        {/* Operators */}
        {operators.map((operator, index) => {
          const pos = getPosition(index, operators.length);
          const isActive = activeOperators.has(operator.type);
          const color = operatorColors[operator.type] || '#6b7280';
          
          return (
            <div
              key={operator.id}
              className={`operator-node ${isActive ? 'active' : ''}`}
              style={{
                transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)`,
                '--operator-color': color
              }}
            >
              <div className="operator-sphere" style={{ borderColor: color, boxShadow: `0 0 20px ${color}` }}>
                {isActive && (
                  <>
                    <div className="pulse-ring" style={{ borderColor: color }}></div>
                    <div className="pulse-ring pulse-ring-2" style={{ borderColor: color }}></div>
                  </>
                )}
              </div>
              <div className="operator-label">
                <div className="operator-name" style={{ color }}>{operator.name}</div>
                <div className="operator-type">{operator.type.toUpperCase()}</div>
              </div>
              
              {isActive && (
                <div className="thinking-particles">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="particle"
                      style={{ 
                        '--angle': `${(i / 8) * 360}deg`,
                        animationDelay: `${i * 0.15}s`,
                        backgroundColor: color
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Connection Lines */}
        {operators.map((op1, i) => 
          operators.slice(i + 1).map((op2, j) => {
            const pos1 = getPosition(i, operators.length);
            const pos2 = getPosition(i + j + 1, operators.length);
            const isActive = activeOperators.has(op1.type) && activeOperators.has(op2.type);
            
            const length = Math.sqrt(
              Math.pow(pos2.x - pos1.x, 2) +
              Math.pow(pos2.y - pos1.y, 2) +
              Math.pow(pos2.z - pos1.z, 2)
            );
            
            const midX = (pos1.x + pos2.x) / 2;
            const midY = (pos1.y + pos2.y) / 2;
            const midZ = (pos1.z + pos2.z) / 2;
            
            const angleX = Math.atan2(pos2.y - pos1.y, Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.z - pos1.z, 2))) * 180 / Math.PI;
            const angleY = Math.atan2(pos2.x - pos1.x, pos2.z - pos1.z) * 180 / Math.PI;
            
            return (
              <div
                key={`line-${i}-${j}`}
                className={`connection-line ${isActive ? 'active' : ''}`}
                style={{
                  width: `${length}px`,
                  transform: `translate3d(${midX}px, ${midY}px, ${midZ}px) rotateY(${angleY}deg) rotateX(${-angleX}deg)`
                }}
              ></div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OperatorVisualization;
