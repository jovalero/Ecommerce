<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SupabaseService
{
    /**
     * Get a configured Guzzle client instance.
     *
     * @param bool $useServiceKey
     * @return Client
     */
    protected function getClient(bool $useServiceKey = false): Client
    {
        $url = config('services.supabase.url');
        $key = $useServiceKey 
            ? config('services.supabase.service_key') 
            : config('services.supabase.anon_key');

        if (empty($url) || empty($key)) {
            Log::error('Supabase configuration missing in config/services.php', [
                'url' => $url ? 'set' : 'missing',
                'key_type' => $useServiceKey ? 'service_key' : 'anon_key',
            ]);
            throw new HttpException(500, 'Supabase credentials are not configured.');
        }

        return new Client([
            'base_uri' => rtrim($url, '/') . '/rest/v1/',
            'headers' => [
                'apikey' => $key,
                'Authorization' => 'Bearer ' . $key,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation',
            ],
            'timeout' => 15.0,
        ]);
    }

    /**
     * Execute an HTTP request to Supabase (PostgREST) and handle responses.
     *
     * @param string $method
     * @param string $uri
     * @param array $options
     * @param bool $useServiceKey
     * @return array
     * @throws HttpException
     */
    protected function request(string $method, string $uri, array $options = [], bool $useServiceKey = false): array
    {
        try {
            $client = $this->getClient($useServiceKey);
            $response = $client->request($method, $uri, $options);
            $body = $response->getBody()->getContents();
            
            return json_decode($body, true) ?? [];
        } catch (RequestException $e) {
            $response = $e->getResponse();
            $statusCode = $response ? $response->getStatusCode() : 500;
            $body = $response ? $response->getBody()->getContents() : $e->getMessage();
            
            Log::error("Supabase API Error [{$statusCode}] on {$method} {$uri}: {$body}", [
                'exception_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'request_options' => $options,
            ]);

            throw new HttpException(
                $statusCode, 
                "Supabase integration error: " . ($response ? $body : $e->getMessage()), 
                $e
            );
        } catch (\Exception $e) {
            Log::error("Unexpected Error in SupabaseService on {$method} {$uri}: " . $e->getMessage(), [
                'exception' => $e,
            ]);
            throw new HttpException(500, "Unexpected integration error", $e);
        }
    }

    /**
     * Get records from a table with optional filter query parameters.
     *
     * @param string $table
     * @param array $query
     * @param bool $useServiceKey
     * @return array
     */
    public function get(string $table, array $query = [], bool $useServiceKey = false): array
    {
        return $this->request('GET', $table, ['query' => $query], $useServiceKey);
    }

    /**
     * Get a single record from a table by ID.
     *
     * @param string $table
     * @param string $id
     * @param bool $useServiceKey
     * @return array|null
     */
    public function getOne(string $table, string $id, bool $useServiceKey = false): ?array
    {
        $results = $this->request('GET', $table, [
            'query' => ['id' => 'eq.' . $id]
        ], $useServiceKey);
        
        return !empty($results) ? $results[0] : null;
    }

    /**
     * Insert a record into a table.
     *
     * @param string $table
     * @param array $data
     * @param bool $useServiceKey
     * @return array
     */
    public function insert(string $table, array $data, bool $useServiceKey = false): array
    {
        return $this->request('POST', $table, ['json' => $data], $useServiceKey);
    }

    /**
     * Update a record in a table by ID.
     *
     * @param string $table
     * @param string $id
     * @param array $data
     * @param bool $useServiceKey
     * @return array
     */
    public function update(string $table, string $id, array $data, bool $useServiceKey = false): array
    {
        return $this->request('PATCH', $table, [
            'query' => ['id' => 'eq.' . $id],
            'json' => $data,
        ], $useServiceKey);
    }

    /**
     * Delete a record in a table by ID.
     *
     * @param string $table
     * @param string $id
     * @param bool $useServiceKey
     * @return array
     */
    public function delete(string $table, string $id, bool $useServiceKey = false): array
    {
        return $this->request('DELETE', $table, [
            'query' => ['id' => 'eq.' . $id]
        ], $useServiceKey);
    }
}
