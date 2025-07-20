const { useState, useEffect, useContext, createContext, useRef } = React;
const { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } = ReactRouterDOM;

// Service data
const servicesData = {
  "categories": [
    {
      "name": "Compute",
      "services": ["EC2","Lambda","ECS","EKS","Lightsail","Batch","Outposts"]
    },
    {
      "name": "Storage",
      "services": ["S3","EBS","EFS","FSx","Glacier","Storage Gateway"]
    },
    {
      "name": "Database",
      "services": ["RDS","DynamoDB","Aurora","DocumentDB","Redshift"]
    },
    {
      "name": "Networking & CDN",
      "services": ["VPC","CloudFront","Route53","API Gateway","Direct Connect","Transit Gateway"]
    },
    {
      "name": "Security, Identity, Compliance",
      "services": ["IAM","Cognito","KMS","Shield","WAF"]
    }
  ],
  "pricing": {
    "EC2": {
      "t2.micro": 0.0116,
      "t3.medium": 0.0416
    },
    "S3": {
      "StandardPerGBMonth": 0.023
    },
    "Lambda": {
      "RequestPerMillion": 0.20,
      "GBSecond": 0.00001667
    }
  },
  "wizards": {
    "EC2": {
      "steps": [
        {"id": "ami", "title": "Choose AMI", "fields": [{"name": "ami", "type": "select", "options": ["Amazon Linux 2025", "Ubuntu 24.04", "Windows 2025"]}]},
        {"id": "type", "title": "Choose Instance Type", "fields": [{"name": "instanceType", "type": "select", "options": ["t2.micro", "t3.micro", "t3.medium"]}]},
        {"id": "config", "title": "Configure Instance", "fields": [{"name": "instanceCount", "type": "number", "default": 1}]},
        {"id": "storage", "title": "Add Storage", "fields": [{"name": "rootVolume", "type": "number", "default": 30}]},
        {"id": "tags", "title": "Add Tags", "fields": [{"name": "tags", "type": "kv"}]},
        {"id": "security", "title": "Configure Security Group", "fields": [{"name": "sg", "type": "multiselect", "options": ["default", "web", "ssh-only"]}]},
        {"id": "review", "title": "Review", "fields": []}
      ]
    },
    "S3": {
      "steps": [
        {"id": "bucketName", "title": "Bucket Name", "fields": [{"name": "bucket", "type": "text"}]},
        {"id": "region", "title": "Region", "fields": [{"name": "region", "type": "select", "options": ["us-east-1","eu-west-1"]}]},
        {"id": "review", "title": "Review", "fields": []}
      ]
    },
    "Lambda": {
      "steps": [
        {"id": "functionName", "title": "Function Name", "fields": [{"name": "function", "type": "text"}]},
        {"id": "runtime", "title": "Runtime", "fields": [{"name": "runtime", "type": "select", "options": ["nodejs20.x","python3.12"]}]},
        {"id": "code", "title": "Upload Code", "fields": [{"name": "code", "type": "file"}]},
        {"id": "review", "title": "Review", "fields": []}
      ]
    }
  }
};

// Auth Context
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = (username, password) => {
    if (username === 'vijayrajeshr' && password === 'Vijay@123') {
      setIsAuthenticated(true);
      setUser({ username: 'vijayrajeshr', name: 'Vijay Rajesh R' });
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Resource Store Context
const ResourceStoreContext = createContext();

const ResourceStoreProvider = ({ children }) => {
  const [resources, setResources] = useState({});

  const addResource = (serviceId, resource) => {
    const newResource = {
      ...resource,
      id: `${serviceId}-${Date.now()}`,
      state: 'running',
      createdAt: new Date().toISOString(),
      runningHours: 0,
      region: 'us-east-1'
    };

    setResources(prev => ({
      ...prev,
      [serviceId]: [...(prev[serviceId] || []), newResource]
    }));

    return newResource.id;
  };

  const updateResource = (serviceId, resourceId, updates) => {
    setResources(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] || []).map(resource =>
        resource.id === resourceId ? { ...resource, ...updates } : resource
      )
    }));
  };

  const deleteResource = (serviceId, resourceId) => {
    setResources(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] || []).filter(resource => resource.id !== resourceId)
    }));
  };

  const getResources = (serviceId) => {
    return resources[serviceId] || [];
  };

  const getTotalCost = () => {
    let total = 0;
    Object.keys(resources).forEach(serviceId => {
      resources[serviceId].forEach(resource => {
        if (resource.state === 'running') {
          const pricing = servicesData.pricing[serviceId.toUpperCase()];
          if (pricing && resource.instanceType) {
            total += (pricing[resource.instanceType] || 0) * (resource.runningHours || 0);
          }
        }
      });
    });
    return total;
  };

  // Simulate running hours increment
  useEffect(() => {
    const interval = setInterval(() => {
      setResources(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(serviceId => {
          updated[serviceId] = updated[serviceId].map(resource => ({
            ...resource,
            runningHours: resource.state === 'running' ? (resource.runningHours || 0) + 0.01 : resource.runningHours
          }));
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ResourceStoreContext.Provider value={{
      resources,
      addResource,
      updateResource,
      deleteResource,
      getResources,
      getTotalCost
    }}>
      {children}
    </ResourceStoreContext.Provider>
  );
};

// Sign In Page
const SignInPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (login(username, password)) {
        navigate('/console');
      } else {
        setError('Your username or password is incorrect. Please try again.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="signin-container">
      <div className="signin-box">
        <div className="signin-logo">
          <h1>AWS</h1>
          <p>Amazon Web Services</p>
        </div>
        
        {error && (
          <div className="error-alert">
            <strong>Sign-in Error:</strong> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary btn-full-width"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Top Navigation
const TopNav = ({ onMenuToggle, showMobileMenu }) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="top-nav">
      <div className="nav-left">
        <button className="mobile-menu-toggle" onClick={onMenuToggle}>
          ☰
        </button>
        <Link to="/console" className="aws-logo">AWS</Link>
        <div className="global-search">
          <input type="text" placeholder="Search for services, features, blogs, docs, and more" />
          <span className="search-icon">🔍</span>
        </div>
      </div>
      
      <div className="nav-right">
        <div className="region-selector">
          <select defaultValue="us-east-1">
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">Europe (Ireland)</option>
          </select>
        </div>
        
        <div className="account-menu">
          <button
            className="account-button"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          >
            <span>{user?.name || 'Account'}</span>
            <span>▼</span>
          </button>
          
          {accountMenuOpen && (
            <div className="account-dropdown">
              <button onClick={() => navigate('/billing')}>Billing</button>
              <button onClick={() => navigate('/console')}>My Account</button>
              <button onClick={handleSignOut}>Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Left Navigation
const LeftNav = ({ isOpen, onClose }) => {
  const location = useLocation();
  
  const favoriteServices = ['EC2', 'S3', 'Lambda', 'RDS'];

  return (
    <nav className={`left-nav ${isOpen ? 'mobile-open' : ''}`}>
      <div className="nav-section">
        <h3>Favorites</h3>
        {favoriteServices.map(service => (
          <Link
            key={service}
            to={`/console/${service.toLowerCase()}`}
            className={`nav-item ${location.pathname === `/console/${service.toLowerCase()}` ? 'active' : ''}`}
            onClick={onClose}
          >
            {service}
          </Link>
        ))}
      </div>
      
      <div className="nav-section">
        <h3>Recently Visited</h3>
        <Link
          to="/services"
          className={`nav-item ${location.pathname === '/services' ? 'active' : ''}`}
          onClick={onClose}
        >
          All Services
        </Link>
        <Link
          to="/billing"
          className={`nav-item ${location.pathname === '/billing' ? 'active' : ''}`}
          onClick={onClose}
        >
          Billing
        </Link>
      </div>
    </nav>
  );
};

// Wizard Component
const Wizard = ({ isOpen, onClose, service, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const wizard = servicesData.wizards[service] || {
    steps: [
      { id: 'name', title: 'Name', fields: [{ name: 'name', type: 'text' }] },
      { id: 'review', title: 'Review', fields: [] }
    ]
  };

  const currentStepData = wizard.steps[currentStep];

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };

  const validateStep = () => {
    const newErrors = {};
    currentStepData.fields.forEach(field => {
      if (field.type !== 'file' && !formData[field.name] && field.name !== 'tags') {
        newErrors[field.name] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < wizard.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(formData);
        onClose();
        setCurrentStep(0);
        setFormData({});
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || field.default || '';
    const error = errors[field.name];

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="form-group">
            <label>{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
            <select
              className="form-control"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            >
              <option value="">Select {field.name}</option>
              {field.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {error && <div className="error-text">{error}</div>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="form-group">
            <label>{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
            <input
              type="number"
              className="form-control"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
            {error && <div className="error-text">{error}</div>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="form-group">
            <label>{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
            {field.options.map(option => (
              <label key={option} style={{ display: 'block', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={(formData[field.name] || []).includes(option)}
                  onChange={(e) => {
                    const current = formData[field.name] || [];
                    const updated = e.target.checked
                      ? [...current, option]
                      : current.filter(item => item !== option);
                    handleFieldChange(field.name, updated);
                  }}
                  style={{ marginRight: '8px' }}
                />
                {option}
              </label>
            ))}
            {error && <div className="error-text">{error}</div>}
          </div>
        );

      case 'kv':
        return (
          <div key={field.name} className="form-group">
            <label>Tags (Key=Value, one per line)</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Environment=Production&#10;Owner=TeamA"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
          </div>
        );

      case 'file':
        return (
          <div key={field.name} className="form-group">
            <label>{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
            <input
              type="file"
              className="form-control"
              onChange={(e) => handleFieldChange(field.name, e.target.files[0]?.name || '')}
            />
            {error && <div className="error-text">{error}</div>}
          </div>
        );

      default:
        return (
          <div key={field.name} className="form-group">
            <label>{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
            <input
              type="text"
              className="form-control"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
            {error && <div className="error-text">{error}</div>}
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-labelledby="wizard-title">
        <div className="modal-header">
          <h2 id="wizard-title" className="modal-title">
            {service} - {currentStepData.title}
          </h2>
          <button className="close-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        
        <div className="wizard-steps">
          {wizard.steps.map((step, index) => (
            <div
              key={step.id}
              className={`wizard-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              {step.title}
            </div>
          ))}
        </div>
        
        <div className="wizard-content">
          {currentStepData.id === 'review' ? (
            <div className="wizard-form">
              <h3>Review Configuration</h3>
              <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '4px' }}>
                {Object.entries(formData).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <strong>{key}:</strong> {Array.isArray(value) ? value.join(', ') : String(value)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="wizard-form">
              {currentStepData.fields.map(renderField)}
            </div>
          )}
        </div>
        
        <div className="wizard-actions">
          <div className="wizard-actions-left">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
          <div className="wizard-actions-right">
            {currentStep > 0 && (
              <button className="btn btn-secondary" onClick={handlePrevious}>
                Previous
              </button>
            )}
            <button className="btn btn-primary" onClick={handleNext}>
              {currentStep === wizard.steps.length - 1 ? 'Launch' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { getResources } = useContext(ResourceStoreContext);
  
  const recentServices = [
    { id: 'ec2', name: 'EC2', description: 'Virtual servers in the cloud', count: getResources('ec2').length },
    { id: 's3', name: 'S3', description: 'Scalable storage in the cloud', count: getResources('s3').length },
    { id: 'lambda', name: 'Lambda', description: 'Run code without servers', count: getResources('lambda').length },
    { id: 'rds', name: 'RDS', description: 'Managed relational database', count: getResources('rds').length }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>AWS Management Console</h1>
        <p>Welcome to your AWS Console</p>
      </div>
      
      <div className="search-services">
        <input
          type="text"
          placeholder="Search for AWS services"
          className="service-search"
        />
      </div>
      
      <div className="service-cards">
        {recentServices.map(service => (
          <Link key={service.id} to={`/console/${service.id}`} className="service-card">
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            <p style={{ marginTop: '12px', color: '#FF9900', fontWeight: '500' }}>
              {service.count} resources
            </p>
          </Link>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link to="/services" className="btn btn-primary">
          View All Services
        </Link>
      </div>
    </div>
  );
};

// All Services Grid
const AllServicesGrid = () => {
  return (
    <div className="services-grid">
      <div className="dashboard-header">
        <h1>All Services</h1>
        <p>Browse all AWS services by category</p>
      </div>
      
      {servicesData.categories.map(category => (
        <div key={category.name} className="category-section">
          <h2 className="category-title">{category.name}</h2>
          <div className="services-row">
            {category.services.map(service => (
              <Link
                key={service}
                to={`/console/${service.toLowerCase()}`}
                className="service-item"
              >
                {service}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Generic Service Home Component
const ServiceHome = ({ serviceId }) => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const { getResources, updateResource, deleteResource, addResource } = useContext(ResourceStoreContext);
  
  const serviceName = serviceId.toUpperCase();
  const resources = getResources(serviceId);
  
  const handleWizardComplete = (formData) => {
    addResource(serviceId, formData);
  };

  const handleResourceAction = (resourceId, action) => {
    if (action === 'delete') {
      deleteResource(serviceId, resourceId);
    } else {
      updateResource(serviceId, resourceId, { state: action });
    }
  };

  const getResourceCost = (resource) => {
    if (serviceId === 'ec2' && resource.state === 'running') {
      const pricing = servicesData.pricing.EC2;
      return ((pricing[resource.instanceType] || 0) * (resource.runningHours || 0)).toFixed(4);
    }
    return '0.0000';
  };

  return (
    <div className="service-home">
      <div className="service-header">
        <h1 className="service-title">{serviceName}</h1>
        <button
          className="btn btn-primary"
          onClick={() => setWizardOpen(true)}
        >
          {serviceId === 'ec2' ? 'Launch Instance' : 
           serviceId === 's3' ? 'Create Bucket' :
           serviceId === 'lambda' ? 'Create Function' : 
           `Create ${serviceName}`}
        </button>
      </div>
      
      <div className="resources-table">
        <div className="table-header">
          {serviceName} Resources ({resources.length})
        </div>
        
        {resources.length === 0 ? (
          <div className="empty-state">
            <h3>No resources found</h3>
            <p>Create your first {serviceName} resource to get started.</p>
            <button
              className="btn btn-primary"
              onClick={() => setWizardOpen(true)}
            >
              Get Started
            </button>
          </div>
        ) : (
          resources.map(resource => (
            <div key={resource.id} className="table-row">
              <div>
                <strong>{resource.name || resource.bucket || resource.function || resource.id}</strong>
                <div style={{ fontSize: '12px', color: '#879196' }}>
                  Created: {new Date(resource.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <span className={`status-badge status-${resource.state}`}>
                  {resource.state}
                </span>
              </div>
              <div>{resource.region}</div>
              <div>${getResourceCost(resource)}</div>
              <div className="resource-actions">
                {resource.state === 'running' && (
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleResourceAction(resource.id, 'stopped')}
                  >
                    Stop
                  </button>
                )}
                {resource.state === 'stopped' && (
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => handleResourceAction(resource.id, 'running')}
                  >
                    Start
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => handleResourceAction(resource.id, 'delete')}
                  style={{ backgroundColor: '#D13212', color: 'white' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <Wizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        service={serviceName}
        onComplete={handleWizardComplete}
      />
    </div>
  );
};

// Billing Dashboard
const BillingDashboard = () => {
  const { getTotalCost, resources } = useContext(ResourceStoreContext);
  
  const currentCost = getTotalCost();
  const monthlyProjection = currentCost * 730; // Approximate hours in a month
  
  const getServiceCosts = () => {
    const costs = {};
    Object.keys(resources).forEach(serviceId => {
      costs[serviceId] = 0;
      resources[serviceId].forEach(resource => {
        if (resource.state === 'running' && serviceId === 'ec2') {
          const pricing = servicesData.pricing.EC2;
          costs[serviceId] += (pricing[resource.instanceType] || 0) * (resource.runningHours || 0);
        }
      });
    });
    return costs;
  };

  const serviceCosts = getServiceCosts();

  return (
    <div className="billing-dashboard">
      <div className="dashboard-header">
        <h1>Billing & Cost Management</h1>
        <p>Monitor your AWS spending and usage</p>
      </div>
      
      <div className="billing-summary">
        <div className="summary-card">
          <h3>Current Month Cost</h3>
          <div className="amount">${currentCost.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <h3>Projected Monthly Cost</h3>
          <div className="amount">${monthlyProjection.toFixed(2)}</div>
        </div>
        <div className="summary-card">
          <h3>Free Tier Status</h3>
          <div className="amount">{currentCost === 0 ? 'Active' : 'Exceeded'}</div>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Cost by Service</h3>
        <div style={{ padding: '20px' }}>
          {Object.keys(serviceCosts).length === 0 ? (
            <div className="empty-state">
              <p>No costs to display. Create some resources to see cost breakdown.</p>
            </div>
          ) : (
            <div>
              {Object.entries(serviceCosts).map(([service, cost]) => (
                <div key={service} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                  <span>{service.toUpperCase()}</span>
                  <span>${cost.toFixed(4)}</span>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #FF9900', paddingTop: '12px', marginTop: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                <span>Total</span>
                <span>${currentCost.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// App Shell Component
const AppShell = ({ children }) => {
  const [leftNavOpen, setLeftNavOpen] = useState(false);

  const handleMenuToggle = () => {
    setLeftNavOpen(!leftNavOpen);
  };

  const handleNavClose = () => {
    setLeftNavOpen(false);
  };

  return (
    <div className="app-shell">
      <TopNav onMenuToggle={handleMenuToggle} showMobileMenu={leftNavOpen} />
      <div className="main-content">
        <LeftNav isOpen={leftNavOpen} onClose={handleNavClose} />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <ResourceStoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<SignInPage />} />
            <Route
              path="/console"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <AllServicesGrid />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/console/:serviceId"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ServiceRoute />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <BillingDashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/console" replace />} />
            <Route path="*" element={<Navigate to="/console" replace />} />
          </Routes>
        </BrowserRouter>
      </ResourceStoreProvider>
    </AuthProvider>
  );
};

// Service Route Component
const ServiceRoute = () => {
  const { serviceId } = ReactRouterDOM.useParams();
  return <ServiceHome serviceId={serviceId} />;
};

// Render the App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);