'use strict';

const PRESETS_SCHEMA = {
  "type": "object",
  "properties": {
    "componentDir": {
      "type": "object",
      "properties": {
        "ROUTINE": {
          "type": "string"
        },
        "SERVICE": {
          "type": "string"
        },
        "TRIGGER": {
          "type": "string"
        }
      }
    },
    "configTags": {
      "oneOf": [
        {
          "type": "string"
        },
        {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      ]
    },
    "referenceAlias": {
      "type": "object"
    },
    "schemaValidation": {
      "type": "boolean"
    }
  },
  "additionalProperties": true
}

const DEPENDENCIES_SCHEMA = {
  "type": "array",
  "items": {
    "oneOf": [
      {
        "type": "string"
      },
      {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          },
          "path": {
            "type": "string"
          },
          "presets": PRESETS_SCHEMA
        },
        "required": [
          "name"
        ],
        "additionalProperties": false
      }
    ]
  }
}

const SEMVER_PATTERN = '.+';

module.exports = {
  FRAMEWORK: {
    NAME: 'devebot'
  },
  APPINFO: {
    FIELDS: ['version', 'name', 'description', 'homepage', 'author', 'license', 'main']
  },
  BOOTSTRAP: {
    launchApplication: {
      context: {
        schema: {
          "type": "object",
          "properties": {
            "appName": {
              "type": "string"
            },
            "appRootPath": {
              "type": "string"
            },
            "privateProfile": {
              "$ref": "#/definitions/contextConfigSchema"
            },
            "privateProfiles": {
              "$ref": "#/definitions/contextConfigSchema"
            },
            "privateSandbox": {
              "$ref": "#/definitions/contextConfigSchema"
            },
            "privateSandboxes": {
              "$ref": "#/definitions/contextConfigSchema"
            },
            "defaultFeatures": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "environmentVarDescriptors": {
              "type": "array",
              "items": {
                "allOf": [
                  {
                    "type": "object",
                    "properties": {
                      "name": {
                        "type": "string"
                      },
                      "aliases": {
                        "type": "array",
                        "items": {
                          "type": "string"
                        }
                      },
                      "scope": {
                        "type": "string"
                      },
                      "description": {
                        "type": "string"
                      }
                    }
                  },
                  {
                    "oneOf": [
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [ "array" ]
                          },
                          "defaultValue": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            }
                          }
                        }
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [ "string" ]
                          },
                          "defaultValue": {
                            "type": "string"
                          },
                          "enum": {
                            "type": "array",
                            "items": {
                              "type": "string"
                            }
                          }
                        }
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [ "boolean" ]
                          },
                          "defaultValue": {
                            "type": "boolean"
                          }
                        }
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "type": "string",
                            "enum": [ "number" ]
                          },
                          "defaultValue": {
                            "type": "number"
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            },
            "environmentVarOccupied": {
              "type": "boolean"
            },
            "presets": PRESETS_SCHEMA
          },
          "required": [ "appRootPath" ],
          "additionalProperties": false,
          "definitions": {
            "contextConfigSchema": {
              "oneOf": [
                {
                  "type": "string"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              ]
            }
          }
        }
      },
      plugins: {
        schema: DEPENDENCIES_SCHEMA
      },
      bridges: {
        schema: DEPENDENCIES_SCHEMA
      }
    },
    registerLayerware: {
      context: {
        schema: {
          "type": "object",
          "properties": {
            "layerRootPath": {
              "type": "string"
            },
            "presets": PRESETS_SCHEMA
          },
          "additionalProperties": false
        }
      },
      plugins: {
        schema: DEPENDENCIES_SCHEMA
      },
      bridges: {
        schema: DEPENDENCIES_SCHEMA
      }
    }
  },
  MANIFEST: {
    DEFAULT_ROOT_NAME: "config",
    SCHEMA_OBJECT: {
      "type": "object",
      "properties": {
        "config": {
          "type": "object",
          "properties": {
            "enabled": {
              "type": "boolean"
            },
            "migration": {
              "type": "object",
              "patternProperties": {
                ".+": {
                  "type": "object",
                  "properties": {
                    "from": {
                      "oneOf": [
                        {
                          "type": "string",
                          "pattern": SEMVER_PATTERN,
                        },
                        {
                          "type": "array",
                          "items": {
                            "type": "string",
                            "pattern": SEMVER_PATTERN,
                          }
                        },
                      ]
                    },
                    "transform": {}
                  }
                }
              }
            },
            "validation": {
              "type": "object",
              "properties": {
                "schema": {
                  "type": "object",
                  "oneOf": [
                    {
                      "$ref": "http://json-schema.org/draft-04/schema#"
                    }
                  ]
                },
                "checkConstraints": {}
              }
            }
          },
          "additionalProperties": false
        }
      }
    }
  },
  LOGGER: {
    LABELS: {
      silly: {
        level: 5,
        color: 'magenta'
      },
      debug: {
        level: 4,
        color: 'blue'
      },
      trace: {
        level: 3,
        color: 'cyan'
      },
      info: {
        level: 2,
        color: 'green'
      },
      warn: {
        level: 1,
        color: 'yellow'
      },
      error: {
        level: 0,
        color: 'red'
      }
    },
    STARTING_POINT: 'affix',
    INTERNAL_LEVEL: 'check'
  },
  TRACER: {
    SECTOR: {
      ID_FIELD: 'blockId',
      NAME_FIELD: 'blockName'
    }
  },
  METAINF: {
    ROOT_KEY: 'metainf',
    SCRIPT_DIR: '/lib/metadata',
    SCHEMA_OBJECT: {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "type": {
          "type": "string"
        },
        "subtype": {
          "type": "string"
        },
        "schema": {
          "type": "object",
          "oneOf": [
            {
              "$ref": "http://json-schema.org/draft-04/schema#"
            }
          ]
        }
      }
    }
  },
  ROUTINE: {
    ROOT_KEY: 'routine',
    SCRIPT_DIR: '/lib/routines',
    SCHEMA_OBJECT: {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "info": {
          "type": "object",
          "properties": {
            "description": {
              "type": "string"
            },
            "options": {
              "type": "array"
            },
            "schema": {
              "type": "object",
              "oneOf": [{
                "$ref": "http://json-schema.org/draft-04/schema#"
              }]
            },
            "validate": {}
          }
        },
        "handler": {},
        "mode": {
          "type": "string",
          "enum": ["direct", "remote", "worker"]
        }
      }
    }
  },
  SERVICE: {
    ROOT_KEY: 'service',
    SCRIPT_DIR: '/lib/services',
    GROUP: 'services'
  },
  TRIGGER: {
    ROOT_KEY: 'trigger',
    SCRIPT_DIR: '/lib/triggers',
    GROUP: 'triggers'
  },
  WEBSOCKET: {
    STATE: {
      ERROR: 'error',
      STARTED: 'started',
      PROGRESS: 'progress',
      TIMEOUT: 'timeout',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed',
      DONE: 'done'
    },
    MSG_ON: {
      ERROR: 'Invalid command object',
      STARTED: 'The command is started',
      PROGRESS: 'The command is processing ...',
      TIMEOUT: 'The command execution is timeout',
      FAILED: 'The command execution is failed',
      CANCELLED: 'The command is cancelled',
      COMPLETED: 'The command execution is completed',
      DONE: 'The command is done'
    },
    DETAILS: {
      SCHEMA: {
        "type": "array",
        "items": {
          "oneOf": [{
            "properties": {
              "type": {
                "type": "string",
                "enum": ["json"]
              },
              "title": {
                "type": "string"
              },
              "data": {
                "type": ["boolean", "number", "string", "array", "object"]
              }
            },
            "required": ["type", "data"]
          }, {
            "properties": {
              "type": {
                "type": "string",
                "enum": ["record", "object"]
              },
              "title": {
                "type": "string"
              },
              "label": {
                "type": "object"
              },
              "data": {
                "type": "object"
              }
            },
            "required": ["type", "label", "data"]
          }, {
            "properties": {
              "type": {
                "type": "string",
                "enum": ["table", "grid"]
              },
              "title": {
                "type": "string"
              },
              "label": {
                "type": "object"
              },
              "data": {
                "type": "array",
                "minItems": 1,
                "items": {
                  "type": "object"
                }
              }
            },
            "required": ["type", "label", "data"]
          }]
        }
      }
    }
  },
  UPGRADE_ENABLED: [
    'presets',
    'bridge-full-ref',
    'standardizing-config',
    'gadget-around-log',
    'simplify-name-resolver',
    'refining-name-resolver',
    'bean-decorator',
    // 'metadata-refiner',
    'manifest-refiner',
  ]
};
