# Get Task Details

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /api/v1/jobs/recordInfo:
    get:
      summary: Get Task Details
      deprecated: false
      description: >-
        Query the status and results of any task created in the Market models.
        This is a unified query interface that works with all models under the
        Market category.


        ### Supported Models

        This endpoint works with all Market models including:

        - **Seedream**: seedream, seedream-v4-text-to-image, etc.

        - **Grok Imagine**: text-to-image, image-to-video, text-to-video,
        upscale

        - **Kling**: text-to-video, image-to-video models

        - **ElevenLabs**: Audio processing models

        - **Claude**: Language models

        - **And any future models added to the Market**


        ### Task States

        - **waiting**: Task is queued and waiting to be processed

        - **queuing**: Task is in the processing queue

        - **generating**: Task is currently being processed

        - **success**: Task completed successfully

        - **fail**: Task failed


        ### Best Practices

        - **Use callbacks for production**: Include `callBackUrl` when creating
        tasks to avoid polling

        - **Implement exponential backoff**: Start with 2-3 second intervals,
        increase gradually

        - **Handle timeouts**: Stop polling after 10-15 minutes

        - **Download results immediately**: Generated content URLs typically
        expire after 24 hours
      operationId: get-task-details
      tags:
        - docs/en/Market
      parameters:
        - name: taskId
          in: query
          description: The unique task identifier returned when you created the task.
          required: true
          schema:
            type: string
            examples:
              - task_12345678
      responses:
        '200':
          description: Request successful
          content:
            application/json:
              schema:
                allOf:
                  - &ref_0
                    $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        description: The task data object containing all task information
                        properties:
                          taskId:
                            type: string
                            description: The unique identifier for this task
                            examples:
                              - task_12345678
                          model:
                            type: string
                            description: >-
                              The model used for this task (e.g.,
                              grok-imagine/text-to-image, seedream-4.0,
                              kling-1.0)
                            examples:
                              - grok-imagine/text-to-image
                          state:
                            type: string
                            description: Current state of the task
                            enum:
                              - waiting
                              - queuing
                              - generating
                              - success
                              - fail
                            examples:
                              - success
                          param:
                            type: string
                            description: >-
                              JSON string containing the original request
                              parameters used to create the task
                            examples:
                              - >-
                                {"model":"grok-imagine/text-to-image","callBackUrl":"https://your-domain.com/api/callback","input":{"prompt":"Cinematic
                                portrait...","aspect_ratio":"3:2"}}
                          resultJson:
                            type: string
                            examples:
                              - >-
                                {"resultUrls":["https://example.com/generated-content.jpg"]}
                              - '{"resultObject":{"subject_status":1}}'
                              - >-
                                {"resultObject":{"mask_urls":["https://example.com/mask_1",
                                "https://example.com/mask_2"]}}
                            description: >-
                              A JSON string containing the generated URL. Only
                              exists if the status is "success".


                              Depending on `outputMediaType`, the structure is
                              as follows:

                              - For images/media/videos: {resultUrls: []}

                              - If using Seedance 2 or Seedance 2 Fast with
                              `return_last_frame` enabled: {resultUrls: [],
                              firstFrameUrl: [], lastFrameUrl: []}

                              - For text output: {resultObject: {}}


                              For OmniHuman series models:

                              - OmniHuman 1.5 Subject Detection (subject
                              detection model): response structure is
                              {resultObject: {mask_urls: ["url1", "url2",
                              ...]}}, returning a list of mask image URLs
                              corresponding to the detected subjects. The URLs
                              returned by this model are valid for 1 hour.

                              - OmniHuman 1.5 Human Identification (human
                              identification model): response structure is
                              {resultObject: {subject_status: 1}}, where
                              `subject_status` means 0 = no subject detected, 1
                              = subject detected, indicating whether a human
                              subject is detected in the image.
                          failCode:
                            type: string
                            description: >-
                              Error code if the task failed. Empty string if
                              successful
                            examples:
                              - ''
                          failMsg:
                            type: string
                            description: >-
                              Error message if the task failed. Empty string if
                              successful
                            examples:
                              - ''
                          costTime:
                            type: integer
                            format: int64
                            description: >-
                              Processing time in milliseconds (available when
                              successful)
                            examples:
                              - 15000
                          completeTime:
                            type: integer
                            format: int64
                            description: >-
                              Completion timestamp (Unix timestamp in
                              milliseconds)
                            examples:
                              - 1698765432000
                          createTime:
                            type: integer
                            format: int64
                            description: >-
                              Creation timestamp (Unix timestamp in
                              milliseconds)
                            examples:
                              - 1698765400000
                          updateTime:
                            type: integer
                            format: int64
                            description: Update timestamp (Unix timestamp in milliseconds)
                            examples:
                              - 1698765432000
                          progress:
                            type: integer
                            description: >-
                              Generation progress (0-100). Only returned when
                              model is sora2 or sora2 pro.
                            minimum: 0
                            maximum: 100
                            examples:
                              - 45
                          creditsConsumed:
                            type: number
                            description: >-
                              Credit consumption details for this task,
                              indicating the actual number of credits deducted
                              during task execution.
                        x-apidog-orders:
                          - taskId
                          - model
                          - state
                          - param
                          - resultJson
                          - failCode
                          - failMsg
                          - costTime
                          - completeTime
                          - createTime
                          - updateTime
                          - progress
                          - creditsConsumed
                        x-apidog-ignore-properties: []
                    x-apidog-orders:
                      - data
                    x-apidog-ignore-properties: []
              example:
                code: 505
                msg: success
                data:
                  taskId: task_12345678
                  model: grok-imagine/text-to-image
                  state: success
                  param: >-
                    {"model":"grok-imagine/text-to-image","callBackUrl":"https://your-domain.com/api/callback","input":{"prompt":"Cinematic
                    portrait...","aspect_ratio":"3:2"}}
                  resultJson: '{"resultUrls":["https://example.com/generated-content.jpg"]}'
                  failCode: ''
                  failMsg: ''
                  costTime: 15000
                  completeTime: 1698765432000
                  createTime: 1698765400000
                  updateTime: 1698765432000
                  progress: 45
                  creditsConsumed: 50
          headers: {}
          x-apidog-name: ''
        '400':
          description: Bad Request - Missing or invalid taskId parameter
          content:
            application/json:
              schema: *ref_0
              example:
                code: 400
                msg: taskId parameter is required
          headers: {}
          x-apidog-name: ''
        '401':
          description: Unauthorized - Invalid or missing API key
          content:
            application/json:
              schema: *ref_0
              example:
                code: 401
                msg: Unauthorized
          headers: {}
          x-apidog-name: ''
        '404':
          description: Task Not Found - The specified taskId does not exist
          content:
            application/json:
              schema: *ref_0
              example:
                code: 404
                msg: Task not found
          headers: {}
          x-apidog-name: ''
        '422':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  msg:
                    type: string
                  data:
                    type: 'null'
                required:
                  - code
                  - msg
                  - data
                x-apidog-orders:
                  - code
                  - msg
                  - data
                x-apidog-ignore-properties: []
              example:
                code: 422
                msg: recordInfo is null
                data: null
          headers: {}
          x-apidog-name: ''
        '429':
          description: Rate Limited - Too many requests
          content:
            application/json:
              schema: *ref_0
              example:
                code: 429
                msg: Rate limit exceeded
          headers: {}
          x-apidog-name: ''
        '500':
          description: request failed
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    description: >-
                      Response status code


                      - **200**: Success - Request has been processed
                      successfully

                      - **401**: Unauthorized - Authentication credentials are
                      missing or invalid

                      - **402**: Insufficient Credits - Account does not have
                      enough credits to perform the operation

                      - **404**: Not Found - The requested resource or endpoint
                      does not exist

                      - **408**: Upstream is currently experiencing service
                      issues. No result has been returned for over 10 minutes.

                      - **422**: Validation Error - The request parameters
                      failed validation checks

                      - **429**: Rate Limited - Request limit has been exceeded
                      for this resource

                      - **455**: Service Unavailable - System is currently
                      undergoing maintenance

                      - **500**: Server Error - An unexpected error occurred
                      while processing the request

                      - **501**: Generation Failed - Content generation task
                      failed

                      - **505**: Feature Disabled - The requested feature is
                      currently disabled
                  msg:
                    type: string
                    description: Response message, error description when failed
                  data:
                    type: object
                    properties: {}
                    x-apidog-orders: []
                    x-apidog-ignore-properties: []
                x-apidog-orders:
                  - code
                  - msg
                  - data
                required:
                  - code
                  - msg
                  - data
                x-apidog-ignore-properties: []
              example:
                code: 500
                msg: >-
                  Server Error - An unexpected error occurred while processing
                  the request
                data: null
          headers: {}
          x-apidog-name: 'Error '
      security:
        - BearerAuth: []
          x-apidog:
            schemeGroups:
              - id: kn8M4YUlc5i0A0179ezwx
                schemeIds:
                  - BearerAuth
            required: true
            use:
              id: kn8M4YUlc5i0A0179ezwx
            scopes:
              kn8M4YUlc5i0A0179ezwx:
                BearerAuth: []
      x-apidog-folder: docs/en/Market
      x-apidog-status: released
      x-run-in-apidog: https://app.apidog.com/web/project/1184766/apis/api-28506351-run
components:
  schemas:
    ApiResponse:
      type: object
      properties:
        code:
          type: integer
          description: >-
            Response status code


            - **200**: Success - Request has been processed successfully

            - **401**: Unauthorized - Authentication credentials are missing or
            invalid

            - **402**: Insufficient Credits - Account does not have enough
            credits to perform the operation

            - **404**: Not Found - The requested resource or endpoint does not
            exist

            - **422**: Validation Error - The request parameters failed
            validation checks

            - **429**: Rate Limited - Request limit has been exceeded for this
            resource

            - **433**: Request Limit - Sub-key Usage Exceeds Limit

            - **455**: Service Unavailable - System is currently undergoing
            maintenance

            - **500**: Server Error - An unexpected error occurred while
            processing the request

            - **501**: Generation Failed - Content generation task failed

            - **505**: Feature Disabled - The requested feature is currently
            disabled
          enum:
            - 200
            - 401
            - 402
            - 404
            - 422
            - 429
            - 433
            - 455
            - 500
            - 501
            - 505
          x-apidog-enum:
            - value: 200
              name: ''
              description: ''
            - value: 401
              name: ''
              description: ''
            - value: 402
              name: ''
              description: ''
            - value: 404
              name: ''
              description: ''
            - value: 422
              name: ''
              description: ''
            - value: 429
              name: ''
              description: ''
            - value: 433
              name: ''
              description: ''
            - value: 455
              name: ''
              description: ''
            - value: 500
              name: ''
              description: ''
            - value: 501
              name: ''
              description: ''
            - value: 505
              name: ''
              description: ''
        msg:
          type: string
          description: Response message, error description when failed
          examples:
            - success
        data:
          type: object
          properties:
            taskId:
              type: string
              description: >-
                Task ID, can be used with Get Task Details endpoint to query
                task status
          x-apidog-orders:
            - taskId
          required:
            - taskId
          x-apidog-ignore-properties: []
      x-apidog-orders:
        - code
        - msg
        - data
      title: response not with recordId
      required:
        - data
      x-apidog-ignore-properties: []
      x-apidog-folder: ''
  securitySchemes:
    BearerAuth:
      type: bearer
      scheme: bearer
      bearerFormat: API Key
      description: >-
        All API requests require a Bearer Token. Add the header `Authorization:
        Bearer YOUR_API_KEY` to authenticate requests.
    BearerAuth1:
      type: bearer
      scheme: bearer
      bearerFormat: API Key
      description: >-
        所有 API 请求都需要 Bearer Token。请在请求头中添加 `Authorization: Bearer YOUR_API_KEY`
        进行身份验证。
servers:
  - url: https://api.kie.ai
    description: 正式环境
security:
  - BearerAuth: []
    x-apidog:
      schemeGroups:
        - id: kn8M4YUlc5i0A0179ezwx
          schemeIds:
            - BearerAuth
      required: true
      use:
        id: kn8M4YUlc5i0A0179ezwx
      scopes:
        kn8M4YUlc5i0A0179ezwx:
          BearerAuth: []

```
