import { useState, useEffect } from 'react'
import './LihatWO.css'

const LihatWO = () => {
  const [woData, setWoData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('http://localhost:3001/api/wo')
        const data = await response.json()
        setWoData(data)
        setFilteredData(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const filtered = woData.filter(item =>
      Object.values(item).some(value =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, woData])

  const handleDelete = async (incident) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data incident ini?')) {
      try {
        // API call untuk delete
        // await fetch(`/api/incident/${incident}`, { method: 'DELETE' })
        
        const updatedData = woData.filter(item => item.incident !== incident)
        setWoData(updatedData)
        setSelectedItems(selectedItems.filter(item => item !== incident))
      } catch (error) {
        console.error('Error deleting data:', error)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return
    
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedItems.length} incident terpilih?`)) {
      try {
        // API call untuk bulk delete
        // await Promise.all(selectedItems.map(incident => fetch(`/api/incident/${incident}`, { method: 'DELETE' })))
        
        const updatedData = woData.filter(item => !selectedItems.includes(item.incident))
        setWoData(updatedData)
        setSelectedItems([])
      } catch (error) {
        console.error('Error deleting data:', error)
      }
    }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageItems = getCurrentPageData().map(item => item.incident)
      setSelectedItems([...new Set([...selectedItems, ...currentPageItems])])
    } else {
      const currentPageItems = getCurrentPageData().map(item => item.incident)
      setSelectedItems(selectedItems.filter(incident => !currentPageItems.includes(incident)))
    }
  }

  const handleSelectItem = (incident) => {
    if (selectedItems.includes(incident)) {
      setSelectedItems(selectedItems.filter(item => item !== incident))
    } else {
      setSelectedItems([...selectedItems, incident])
    }
  }

  const getCurrentPageData = () => {
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    return filteredData.slice(indexOfFirstItem, indexOfLastItem)
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const getStatusBadge = (status) => {
    const statusColors = {
      'BACKEND': 'warning',
      'CLOSED': 'success',
      'PENDING': 'error',
      'ASSIGNED': 'info',
      'IN PROGRESS': 'warning'
    }
    return statusColors[status] || 'default'
  }

  const getUrgencyBadge = (urgency) => {
    const urgencyColors = {
      '1-Critical': 'critical',
      '2-High': 'high',
      '3-Medium': 'medium',
      '4-Low': 'low'
    }
    return urgencyColors[urgency] || 'default'
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">⏳</div>
        <p>Memuat data incident...</p>
      </div>
    )
  }

  // Get all unique keys from data for dynamic table columns
  const allKeys = Array.from(
    new Set(filteredData.flatMap(obj => Object.keys(obj)))
  )

  return (
    <div className="lihat-wo-container">
      <div className="page-header">
        <h1>📋 Lihat Incident Management</h1>
        <p>Data incident tersimpan dari database (lengkap dengan detail teknis dan customer info)</p>
      </div>

      <div className="table-controls">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Cari berdasarkan incident, summary, customer, witel, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="action-section">
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger"
            >
              🗑️ Hapus Terpilih ({selectedItems.length})
            </button>
          )}
          <div className="data-info">
            Total: {filteredData.length} data
          </div>
        </div>
      </div>

      <div className="table-container" style={{overflowX: 'auto'}}>
        <table className="wo-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={getCurrentPageData().length > 0 && getCurrentPageData().every(item => selectedItems.includes(item.incident))}
                />
              </th>
              {allKeys.map((key) => (
                <th key={key}>{key.replace(/_/g, ' ').toUpperCase()}</th>
              ))}
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentPageData().map((item) => (
              <tr key={item.incident || item.id} className={selectedItems.includes(item.incident) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.incident)}
                    onChange={() => handleSelectItem(item.incident)}
                  />
                </td>
                {allKeys.map((key) => (
                  <td key={key} style={{maxWidth: 200, overflow: 'auto', fontSize: '0.85em'}}>
                    {item[key] !== null && item[key] !== undefined ? String(item[key]) : ''}
                  </td>
                ))}
                <td>
                  <button
                    onClick={() => handleDelete(item.incident)}
                    className="btn-icon btn-delete"
                    title="Hapus"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-outline"
          >
            ← Sebelumnya
          </button>
          
          <div className="page-info">
            Halaman {currentPage} dari {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-outline"
          >
            Selanjutnya →
          </button>
        </div>
      )}

      <div className="info-panel">
        <h3>ℹ️ Informasi Database</h3>
        <div className="db-info">
          <div className="db-card">
            <h4>📊 Database Incident</h4>
            <p>Data incident lengkap dengan detail teknis, customer info, dan resolve status</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LihatWO
