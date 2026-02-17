export const styles = {
  container: { 
    height: '100vh', 
    backgroundColor: '#000', 
    display: 'flex', 
    flexDirection: 'column', 
    color: 'white', 
    fontFamily: 'system-ui, -apple-system, sans-serif', 
    overflow: 'hidden' 
  },
  cameraView: { 
    flex: 1, 
    position: 'relative', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    background: '#121212' 
  },
  topBar: { 
    position: 'absolute', 
    top: '20px', 
    width: '90%', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    zIndex: 10
  },
  pills: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    padding: '6px 24px', 
    borderRadius: '20px', 
    fontWeight: 'bold', 
    fontSize: '13px'
  },
  iconCircle: { 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    padding: '10px', 
    borderRadius: '50%',
    display: 'flex'
  },
  focusFrame: { 
    border: '2px solid rgba(255,255,255,0.7)', 
    width: '240px', 
    height: '240px', 
    borderRadius: '35px', 
    display: 'flex', 
    flexDirection: 'column', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: '15px' 
  },
  statusText: { 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    padding: '4px 15px', 
    borderRadius: '20px', 
    fontSize: '12px'
  },
  controlsPanel: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: '40px', 
    borderTopRightRadius: '40px', 
    padding: '20px 20px 10px 20px', 
    color: '#333', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center'
  },
  tabBar: { 
    display: 'flex', 
    gap: '30px', 
    fontWeight: 'bold', 
    fontSize: '14px', 
    marginBottom: '30px', 
    color: '#999' 
  },
  activeTab: { 
    color: '#000', 
    borderBottom: '2px solid #000',
    paddingBottom: '2px'
  },
  captureRow: { 
    display: 'flex', 
    width: '100%', 
    justifyContent: 'space-around', 
    alignItems: 'center', 
    marginBottom: '8px' 
  },
  captureButton: { 
    width: '80px', 
    height: '80px', 
    borderRadius: '50%', 
    border: '4px solid #000', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'transparent',
    padding: 0,
    cursor: 'pointer'
  },
  captureButtonInner: { 
    width: '66px', 
    height: '66px', 
    borderRadius: '50%', 
    backgroundColor: '#fff', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    border: '1px solid #ccc' 
  },
  thumbnailPreview: { 
    width: '52px', 
    height: '52px', 
    borderRadius: '10px', 
    overflow: 'hidden', 
    border: '2px solid #eee' 
  },
  iconCircleGray: { 
    backgroundColor: '#f0f0f0', 
    padding: '12px', 
    borderRadius: '50%' 
  },
  hintText: { 
    fontSize: '12px', 
    color: '#888', 
    marginBottom: '20px' 
  },
  bottomNav: { 
    display: 'flex', 
    width: '100%', 
    justifyContent: 'space-between', 
    padding: '15px 10px 5px 10px',
    borderTop: '1px solid #f0f0f0'
  },
  navItem: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    fontSize: '10px', 
    color: '#ccc',
    fontWeight: 'bold',
    gap: '4px'
  },
  navItemActive: { 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    fontSize: '10px', 
    color: '#000',
    fontWeight: 'bold',
    gap: '4px'
  },
};