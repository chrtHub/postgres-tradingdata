let userRoles = [
  {
    id: "rol_KLH31hKFrhWaJ1IX",
    name: "Admin-Full-Access",
    description: "For Aaron only",
  },
];

let userPermissions = [
  {
    permission_name: "chat:llm",
    description: "Full access to LLM APIs like OpenAI ChatGPT",
    resource_server_name: "chrt",
    resource_server_identifier: "https://chrt.com",
    sources: [
      {
        source_id: "rol_KLH31hKFrhWaJ1IX",
        source_name: "Admin-Full-Access",
        source_type: "ROLE",
      },
    ],
  },
  {
    permission_name: "generate:diffusion-image",
    description: "Generate images from Stable Diffusions models",
    resource_server_name: "chrt",
    resource_server_identifier: "https://chrt.com",
    sources: [
      {
        source_id: "rol_KLH31hKFrhWaJ1IX",
        source_name: "Admin-Full-Access",
        source_type: "ROLE",
      },
    ],
  },
  {
    permission_name: "invoke:wolfram-all",
    description: "Invoke all Wolfram Language Functions",
    resource_server_name: "chrt",
    resource_server_identifier: "https://chrt.com",
    sources: [
      {
        source_id: "rol_KLH31hKFrhWaJ1IX",
        source_name: "Admin-Full-Access",
        source_type: "ROLE",
      },
    ],
  },
  {
    permission_name: "read:data",
    description: "get market data",
    resource_server_name: "chrt",
    resource_server_identifier: "https://chrt.com",
    sources: [
      {
        source_id: "rol_KLH31hKFrhWaJ1IX",
        source_name: "Admin-Full-Access",
        source_type: "ROLE",
      },
    ],
  },
  {
    permission_name: "write:journal",
    description: "post trading data to chrtUserTradingData on RDS PostgreSQL",
    resource_server_name: "chrt",
    resource_server_identifier: "https://chrt.com",
    sources: [
      {
        source_id: "rol_KLH31hKFrhWaJ1IX",
        source_name: "Admin-Full-Access",
        source_type: "ROLE",
      },
    ],
  },
];

//
