import { GoogleGenAI, Type } from "@google/genai";
import { ClimateData, FloorPlan, RefinementResult, OptimizationEvaluation, ClimateDiagnostics } from "../types";

const API_KEY = process.env.API_KEY || "";

export const getClimateData = async (
  location: string, 
  plotDimensions: string, 
  priority: string
): Promise<ClimateData> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    You are ClimateSense AI, an autonomous climate-aware architect.
    Analyze the local climate for ${location} and recommend passive design strategies.
    
    IMPORTANT: Use your internal architectural knowledge of global climates. 
    Do not search the web. Infer typical conditions for this region.

    INPUT:
    Location: ${location}
    Plot size: ${plotDimensions}
    User priorities: ${priority}
    
    TASK:
    1. Identify major climate challenges typical for this specific region.
    2. Select passive strategies to address them.
    3. Explain reasoning briefly based on passive design principles.
    
    OUTPUT FORMAT:
    Include climate zone, estimated average temps, prevailing winds, and solar potential.
  `;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          location: { type: Type.STRING },
          climateZone: { type: Type.STRING },
          averageTemp: {
            type: Type.OBJECT,
            properties: {
              min: { type: Type.NUMBER },
              max: { type: Type.NUMBER }
            },
            required: ["min", "max"]
          },
          solarPotential: { type: Type.STRING },
          prevailingWinds: { type: Type.STRING },
          climate_challenges: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          design_strategies: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          orientation_guidance: { type: Type.STRING },
          window_guidance: { type: Type.STRING },
          zoning_guidance: { type: Type.STRING }
        },
        required: [
          "location", "climateZone", "averageTemp", "solarPotential", 
          "prevailingWinds", "climate_challenges", "design_strategies",
          "orientation_guidance", "window_guidance", "zoning_guidance"
        ]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateDesign = async (
  climate: ClimateData, 
  plotDimensions: string, 
  requirements: string
): Promise<FloorPlan> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Generate a house floor plan using the selected climate strategies.
    
    INPUT:
    Plot size: ${plotDimensions}
    Required rooms: ${requirements}
    Climate strategies: ${climate.design_strategies.join(", ")}
    
    TASK:
    1. Produce the layout with coordinates.
    2. EXPLAIN REJECTED ALTERNATIVES: List at least 3 alternative options and why they perform worse climatically.
    3. DIAGNOSTICS: Identify heat risk levels, airflow paths, and daylight penetration areas.
    
    RULES:
    - Follow orientation and zoning guidance strictly.
    - Output 2D coordinates (x, y) and dimensions (width, height) in meters.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          designTitle: { type: Type.STRING },
          orientation: { type: Type.NUMBER },
          totalArea: { type: Type.NUMBER },
          architectReasoning: { type: Type.STRING },
          rooms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                width: { type: Type.NUMBER },
                height: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
                windows: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      side: { type: Type.STRING },
                      position: { type: Type.NUMBER },
                      width: { type: Type.NUMBER },
                      shading: { type: Type.BOOLEAN }
                    }
                  }
                }
              },
              required: ["id", "name", "type", "x", "y", "width", "height", "windows", "reasoning"]
            }
          },
          performanceMetrics: {
            type: Type.OBJECT,
            properties: {
              naturalLightScore: { type: Type.NUMBER },
              ventilationEfficiency: { type: Type.NUMBER },
              thermalMassUtilization: { type: Type.NUMBER },
              solarControlRating: { type: Type.NUMBER }
            },
            required: ["naturalLightScore", "ventilationEfficiency", "thermalMassUtilization", "solarControlRating"]
          },
          rejected_alternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                option: { type: Type.STRING },
                reason_for_rejection: { type: Type.STRING }
              },
              required: ["option", "reason_for_rejection"]
            }
          },
          diagnostics: {
            type: Type.OBJECT,
            properties: {
              heat_risk: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    room: { type: Type.STRING },
                    level: { type: Type.STRING }
                  },
                  required: ["room", "level"]
                }
              },
              airflow: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    from: { type: Type.STRING },
                    to: { type: Type.STRING },
                    strength: { type: Type.STRING }
                  },
                  required: ["from", "to", "strength"]
                }
              },
              daylight: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    room: { type: Type.STRING },
                    quality: { type: Type.STRING }
                  },
                  required: ["room", "quality"]
                }
              }
            },
            required: ["heat_risk", "airflow", "daylight"]
          }
        },
        required: ["designTitle", "orientation", "rooms", "totalArea", "performanceMetrics", "architectReasoning", "rejected_alternatives", "diagnostics"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const refineDesign = async (
  currentPlan: FloorPlan,
  climate: ClimateData
): Promise<RefinementResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Review the house design and revise it to improve climate performance.
    
    INPUT:
    Original floor plan: ${JSON.stringify(currentPlan)}

    TASK:
    1. Identify design problems causing lower scores in performance metrics.
    2. Modify layout to optimize.
    3. Update Rejected Alternatives and Diagnostics.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          revised_floor_plan: {
            type: Type.OBJECT,
            properties: {
              designTitle: { type: Type.STRING },
              orientation: { type: Type.NUMBER },
              totalArea: { type: Type.NUMBER },
              architectReasoning: { type: Type.STRING },
              rooms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    type: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                    windows: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          side: { type: Type.STRING },
                          position: { type: Type.NUMBER },
                          width: { type: Type.NUMBER },
                          shading: { type: Type.BOOLEAN }
                        }
                      }
                    }
                  },
                  required: ["id", "name", "type", "x", "y", "width", "height", "windows", "reasoning"]
                }
              },
              performanceMetrics: {
                type: Type.OBJECT,
                properties: {
                  naturalLightScore: { type: Type.NUMBER },
                  ventilationEfficiency: { type: Type.NUMBER },
                  thermalMassUtilization: { type: Type.NUMBER },
                  solarControlRating: { type: Type.NUMBER }
                },
                required: ["naturalLightScore", "ventilationEfficiency", "thermalMassUtilization", "solarControlRating"]
              },
              rejected_alternatives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    option: { type: Type.STRING },
                    reason_for_rejection: { type: Type.STRING }
                  },
                  required: ["option", "reason_for_rejection"]
                }
              },
              diagnostics: {
                type: Type.OBJECT,
                properties: {
                  heat_risk: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        room: { type: Type.STRING },
                        level: { type: Type.STRING }
                      },
                      required: ["room", "level"]
                    }
                  },
                  airflow: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        from: { type: Type.STRING },
                        to: { type: Type.STRING },
                        strength: { type: Type.STRING }
                      },
                      required: ["from", "to", "strength"]
                    }
                  },
                  daylight: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        room: { type: Type.STRING },
                        quality: { type: Type.STRING }
                      },
                      required: ["room", "quality"]
                    }
                  }
                },
                required: ["heat_risk", "airflow", "daylight"]
              }
            },
            required: ["designTitle", "orientation", "rooms", "totalArea", "performanceMetrics", "architectReasoning", "rejected_alternatives", "diagnostics"]
          },
          changes_made: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          expected_improvements: {
            type: Type.OBJECT,
            properties: {
              heat: { type: Type.STRING },
              airflow: { type: Type.STRING },
              heat_improvement_pct: { type: Type.NUMBER },
              airflow_improvement_pct: { type: Type.NUMBER }
            },
            required: ["heat", "airflow", "heat_improvement_pct", "airflow_improvement_pct"]
          }
        },
        required: ["revised_floor_plan", "changes_made", "expected_improvements"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const getDiagnostics = async (floorPlan: FloorPlan): Promise<ClimateDiagnostics> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Generate climate diagnostic overlays for the floor plan.

    INPUT:
    Floor plan JSON: ${JSON.stringify(floorPlan)}

    TASK:
    1. Assign heat risk level to each room.
    2. Identify primary airflow paths between rooms based on typical passive design logic.
    3. Assign daylight quality to each room based on orientation and window placement.

    Use relative, heuristic-based reasoning.
    Do not use maps or external data.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          heat_risk: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                room: { type: Type.STRING },
                level: { type: Type.STRING }
              },
              required: ["room", "level"]
            }
          },
          airflow: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                strength: { type: Type.STRING }
              },
              required: ["from", "to", "strength"]
            }
          },
          daylight: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                room: { type: Type.STRING },
                quality: { type: Type.STRING }
              },
              required: ["room", "quality"]
            }
          }
        },
        required: ["heat_risk", "airflow", "daylight"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const evaluateOptimization = async (metrics: FloorPlan['performanceMetrics']): Promise<OptimizationEvaluation> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Evaluate whether further optimization is likely to improve climate performance.
    
    INPUT:
    Current performance metrics: ${JSON.stringify(metrics)}
    
    TASK:
    1. Decide if another design iteration is justified.
    2. Identify specific parameters to change (e.g., courtyard width, window sizes, openings).
    3. State the expected benefit of these changes.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          iterate: { type: Type.BOOLEAN },
          recommended_adjustments: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          expected_benefit: { type: Type.STRING }
        },
        required: ["iterate", "recommended_adjustments", "expected_benefit"]
      }
    }
  });

  return JSON.parse(response.text);
};
